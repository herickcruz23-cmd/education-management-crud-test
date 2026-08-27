package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
)

// Student mirrors the shape returned by GET /api/v1/students/:id on the
// Node.js backend (backend/src/modules/students/students-repository.js).
type Student struct {
	ID                 int    `json:"id"`
	Name               string `json:"name"`
	Email              string `json:"email"`
	SystemAccess       bool   `json:"systemAccess"`
	Phone              string `json:"phone"`
	Gender             string `json:"gender"`
	Dob                string `json:"dob"`
	Class              string `json:"class"`
	Section            string `json:"section"`
	Roll               int    `json:"roll"`
	FatherName         string `json:"fatherName"`
	FatherPhone        string `json:"fatherPhone"`
	MotherName         string `json:"motherName"`
	MotherPhone        string `json:"motherPhone"`
	GuardianName       string `json:"guardianName"`
	GuardianPhone      string `json:"guardianPhone"`
	RelationOfGuardian string `json:"relationOfGuardian"`
	CurrentAddress     string `json:"currentAddress"`
	PermanentAddress   string `json:"permanentAddress"`
	AdmissionDate      string `json:"admissionDate"`
	ReporterName       string `json:"reporterName"`
}

// getEnv returns the environment variable value or a fallback default.
func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// nodeAPIBaseURL is where the existing Node.js backend is running.
// The Go service NEVER talks to Postgres directly — it only consumes
// the Node API, per the challenge requirements.
var nodeAPIBaseURL = getEnv("NODE_API_URL", "http://localhost:5007")

func fetchStudent(id string, cookie string) (*Student, int, error) {
	url := fmt.Sprintf("%s/api/v1/students/%s", nodeAPIBaseURL, id)

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	// Forward the caller's auth cookies so the Node API's checkApiAccess /
	// authenticateToken middleware can validate the request the same way
	// it would for a normal browser session.
	if cookie != "" {
		req.Header.Set("Cookie", cookie)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, http.StatusBadGateway, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, resp.StatusCode, fmt.Errorf("node API returned %d: %s", resp.StatusCode, string(body))
	}

	var student Student
	if err := json.Unmarshal(body, &student); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return &student, http.StatusOK, nil
}

// pdfEscape escapes characters that are special inside a PDF literal
// string: backslash, opening and closing parentheses.
func pdfEscape(s string) string {
	replacer := strings.NewReplacer(`\`, `\\`, `(`, `\(`, `)`, `\)`)
	return replacer.Replace(s)
}

// buildStudentReportPDF builds a minimal, valid, single-page PDF (no
// external dependencies) containing a simple student report. Byte
// offsets for the xref table are computed dynamically as the buffer is
// written, so the document is always well-formed.
func buildStudentReportPDF(student *Student) []byte {
	lines := []string{
		"Student Report",
		"",
		fmt.Sprintf("ID: %d", student.ID),
		fmt.Sprintf("Name: %s", student.Name),
		fmt.Sprintf("Email: %s", student.Email),
		fmt.Sprintf("Phone: %s", student.Phone),
		fmt.Sprintf("Gender: %s", student.Gender),
		fmt.Sprintf("Date of birth: %s", student.Dob),
		fmt.Sprintf("Class: %s", student.Class),
		fmt.Sprintf("Section: %s", student.Section),
		fmt.Sprintf("Roll: %d", student.Roll),
		fmt.Sprintf("Admission date: %s", student.AdmissionDate),
		"",
		fmt.Sprintf("Father: %s (%s)", student.FatherName, student.FatherPhone),
		fmt.Sprintf("Mother: %s (%s)", student.MotherName, student.MotherPhone),
		fmt.Sprintf("Guardian: %s (%s) - %s", student.GuardianName, student.GuardianPhone, student.RelationOfGuardian),
		"",
		fmt.Sprintf("Current address: %s", student.CurrentAddress),
		fmt.Sprintf("Permanent address: %s", student.PermanentAddress),
		"",
		fmt.Sprintf("Class teacher: %s", student.ReporterName),
	}

	// Build the content stream: start at the top-left of a Letter page
	// (612x792 pt) and move down one line at a time.
	var content bytes.Buffer
	content.WriteString("BT\n/F1 12 Tf\n14 TL\n72 740 Td\n")
	for i, line := range lines {
		if i > 0 {
			content.WriteString("T*\n")
		}
		content.WriteString(fmt.Sprintf("(%s) Tj\n", pdfEscape(line)))
	}
	content.WriteString("ET")
	contentBytes := content.Bytes()

	var buf bytes.Buffer
	offsets := make([]int, 0, 6)

	writeObj := func(n int, body string) {
		offsets = append(offsets, buf.Len())
		buf.WriteString(fmt.Sprintf("%d 0 obj\n%s\nendobj\n", n, body))
	}

	buf.WriteString("%PDF-1.4\n")

	// 1: Catalog
	writeObj(1, "<< /Type /Catalog /Pages 2 0 R >>")
	// 2: Pages
	writeObj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
	// 3: Page
	writeObj(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>")
	// 4: Content stream
	offsets = append(offsets, buf.Len())
	buf.WriteString(fmt.Sprintf("4 0 obj\n<< /Length %d >>\nstream\n", len(contentBytes)))
	buf.Write(contentBytes)
	buf.WriteString("\nendstream\nendobj\n")
	// 5: Font
	writeObj(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

	xrefStart := buf.Len()
	buf.WriteString(fmt.Sprintf("xref\n0 %d\n", len(offsets)+1))
	buf.WriteString("0000000000 65535 f \n")
	for _, off := range offsets {
		buf.WriteString(fmt.Sprintf("%010d 00000 n \n", off))
	}
	buf.WriteString(fmt.Sprintf("trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF", len(offsets)+1, xrefStart))

	return buf.Bytes()
}

func handleStudentReport(w http.ResponseWriter, r *http.Request) {
	// Path is expected to be /api/v1/students/{id}/report
	const prefix = "/api/v1/students/"
	const suffix = "/report"

	path := r.URL.Path
	if !strings.HasPrefix(path, prefix) || !strings.HasSuffix(path, suffix) {
		http.NotFound(w, r)
		return
	}
	id := strings.TrimSuffix(strings.TrimPrefix(path, prefix), suffix)
	if id == "" {
		http.Error(w, `{"error":"Student id is required"}`, http.StatusBadRequest)
		return
	}

	student, status, err := fetchStudent(id, r.Header.Get("Cookie"))
	if err != nil {
		log.Printf("failed to fetch student %s: %v", id, err)
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), status)
		return
	}

	pdfBytes := buildStudentReportPDF(student)

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"student-%s-report.pdf\"", id))
	w.WriteHeader(http.StatusOK)
	w.Write(pdfBytes)
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"status":"ok","nodeApiUrl":"%s"}`, nodeAPIBaseURL)
}

func main() {
	port := getEnv("PORT", "8080")

	mux := http.NewServeMux()
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/api/v1/students/", handleStudentReport)

	log.Printf("Go report service listening on :%s (Node API: %s)", port, nodeAPIBaseURL)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}
