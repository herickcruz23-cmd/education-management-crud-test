FROM golang:1.22-alpine AS build

WORKDIR /app
COPY go.mod ./
COPY main.go ./
RUN go build -o goservice .

FROM alpine:3.20
WORKDIR /app
COPY --from=build /app/goservice ./goservice

EXPOSE 8080

CMD ["./goservice"]
