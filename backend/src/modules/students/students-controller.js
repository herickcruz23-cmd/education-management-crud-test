const asyncHandler = require("express-async-handler");
const { ApiError } = require("../../utils");
const {
    getAllStudents,
    addNewStudent,
    getStudentDetail,
    setStudentStatus,
    updateStudent,
    deleteStudent,
} = require("./students-service");

const handleGetAllStudents = asyncHandler(async (req, res) => {
    const { name, className, section, roll } = req.query;
    const students = await getAllStudents({ name, className, section, roll });
    res.status(200).json(students);
});

const handleAddStudent = asyncHandler(async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        throw new ApiError(400, "Name and email are required");
    }

    const result = await addNewStudent(req.body);
    res.status(201).json(result);
});

const handleUpdateStudent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const payload = { ...req.body, userId: Number(id) };
    const result = await updateStudent(payload);
    res.status(200).json(result);
});

const handleGetStudentDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const student = await getStudentDetail(id);
    res.status(200).json(student);
});

const handleStudentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const reviewerId = req.user?.id ?? null;

    if (status === undefined) {
        throw new ApiError(400, "Status is required");
    }

    const result = await setStudentStatus({ userId: id, reviewerId, status });
    res.status(200).json(result);
});

const handleDeleteStudent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await deleteStudent(id);
    res.status(200).json(result);
});

module.exports = {
    handleGetAllStudents,
    handleGetStudentDetail,
    handleAddStudent,
    handleStudentStatus,
    handleUpdateStudent,
    handleDeleteStudent,
};
