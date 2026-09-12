const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../server");

describe("Role Based Access Control", () => {
  test("Student should NOT access Faculty dashboard", async () => {
    const studentToken = jwt.sign(
      {
        userId: "student-test-id",
        role: "student",
      },
      process.env.JWT_SECRET,
    );

    const response = await request(app)
      .get("/api/faculty/dashboard")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  test("Faculty should access Faculty dashboard", async () => {
    const facultyToken = jwt.sign(
      {
        userId: "faculty-test-id",
        role: "faculty",
      },
      process.env.JWT_SECRET,
    );

    const response = await request(app)
      .get("/api/faculty/dashboard")
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Welcome to Faculty Dashboard");
  });

  test("Faculty should NOT access Admin dashboard", async () => {
    const facultyToken = jwt.sign(
      {
        userId: "faculty-test-id",
        role: "faculty",
      },
      process.env.JWT_SECRET,
    );

    const response = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  test("Student should NOT access Admin dashboard", async () => {
    const studentToken = jwt.sign(
      {
        userId: "student-test-id",
        role: "student",
      },
      process.env.JWT_SECRET,
    );

    const response = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  test("Admin should access Admin dashboard", async () => {
    const adminToken = jwt.sign(
      {
        userId: "admin-test-id",
        role: "admin",
      },
      process.env.JWT_SECRET,
    );

    const response = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Welcome to Admin Dashboard");
  });

  test("User without token should NOT access Faculty dashboard", async () => {
    const response = await request(app).get("/api/faculty/dashboard");

    expect(response.statusCode).toBe(401);
  });
});
