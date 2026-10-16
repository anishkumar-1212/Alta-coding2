import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CodeRunner from "../Components/CodeRunner";
import "./QuestionPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const FINAL_STATUSES = [
  "accepted",
  "wrong_answer",
  "runtime_error",
  "compilation_error",
  "time_limit_exceeded",
  "failed",
];

const statusLabels = {
  pending: "Queued",
  running: "Running",
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  runtime_error: "Runtime Error",
  compilation_error: "Compilation Error",
  time_limit_exceeded: "Time Limit Exceeded",
  failed: "Submission Failed",
};

function QuestionPage() {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [submissionError, setSubmissionError] = useState("");
  const [problemPanelWidth, setProblemPanelWidth] = useState(480);

  useEffect(() => {
    let cancelled = false;

    async function fetchQuestion() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/questions/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch question");
        }

        if (!cancelled) setQuestion(data.question);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to fetch question");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchQuestion();
    return () => {
      cancelled = true;
    };
  }, [id]);
  const handleProblemResize = (event) => {
    event.preventDefault();

    const workspace = event.currentTarget.parentElement;
    if (!workspace) return;

    const bounds = workspace.getBoundingClientRect();
    const minProblemWidth = 300;
    const minEditorWidth = 400;
    const handleWidth = 6;

    const maxProblemWidth = bounds.width - minEditorWidth - handleWidth;

    if (maxProblemWidth < minProblemWidth) return;

    const onMouseMove = (moveEvent) => {
      const newWidth = moveEvent.clientX - bounds.left;

      setProblemPanelWidth(
        Math.max(minProblemWidth, Math.min(newWidth, maxProblemWidth)),
      );
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  useEffect(() => {
    if (!submission?._id) return;

    let cancelled = false;
    let timeoutId;

    async function checkSubmission() {
      try {
        const response = await fetch(
          `${API_URL}/api/submissions/${submission._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to check submission");
        }

        if (cancelled) return;

        setSubmission(data);

        const status = data.status?.toLowerCase();

        if (status === "pending" || status === "running") {
          timeoutId = setTimeout(checkSubmission, 1500);
        }
      } catch (err) {
        if (!cancelled) {
          setSubmissionError(err.message || "Could not check submission");
        }
      }
    }

    if (!FINAL_STATUSES.includes(submission.status?.toLowerCase())) {
      timeoutId = setTimeout(checkSubmission, 1000);
    }

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [submission?._id, submission?.status]);

  if (loading)
    return <div className="question-page-message">Loading question...</div>;
  if (error) return <div className="question-page-message">{error}</div>;
  if (!question)
    return <div className="question-page-message">Question not found.</div>;

  const currentStatus = submission?.status?.toLowerCase();
  const isAccepted = currentStatus === "accepted";

  return (
    <main
      className={`question-workspace ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      <header className="workspace-header">
        <div className="workspace-brand">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed((value) => !value)}
            aria-label={
              sidebarCollapsed ? "Show question panel" : "Hide question panel"
            }
            title={sidebarCollapsed ? "Show problem" : "Hide problem"}
          >
            {sidebarCollapsed ? "☰" : "◧"}
          </button>
          <span className="brand-name">
            CodeForge <span>AI</span>
          </span>
          <span className="workspace-divider">/</span>
          <span className="workspace-label">Coding Workspace</span>
        </div>

        <div className="workspace-question-title">{question.title}</div>
      </header>

      <div
        className="workspace-body"
        style={{
          "--problem-panel-width": `${problemPanelWidth}px`,
        }}
      >
        {!sidebarCollapsed && (
          <>
            <aside className="problem-panel">
              <div className="problem-panel-heading">
                <h1>{question.title}</h1>
                <span
                  className={`question-difficulty difficulty-${(
                    question.difficulty || ""
                  ).toLowerCase()}`}
                >
                  {question.difficulty || "Unrated"}
                </span>
              </div>

              <div className="problem-description">
                <p>{question.description}</p>

                {question.constraints && (
                  <section>
                    <h2>Constraints</h2>
                    <p>{question.constraints}</p>
                  </section>
                )}

                {question.inputFormat && (
                  <section>
                    <h2>Input Format</h2>
                    <p>{question.inputFormat}</p>
                  </section>
                )}

                {question.outputFormat && (
                  <section>
                    <h2>Output Format</h2>
                    <p>{question.outputFormat}</p>
                  </section>
                )}

                {question.sampleInput && (
                  <section>
                    <h2>Sample Input</h2>
                    <pre>{question.sampleInput}</pre>
                  </section>
                )}

                {question.sampleOutput && (
                  <section>
                    <h2>Sample Output</h2>
                    <pre>{question.sampleOutput}</pre>
                  </section>
                )}

                {question.explanation && (
                  <section>
                    <h2>Explanation</h2>
                    <p>{question.explanation}</p>
                  </section>
                )}
              </div>
            </aside>
            <div
              className="problem-resize-handle"
              onMouseDown={handleProblemResize}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize problem panel"
              title="Drag to resize"
            />
          </>
        )}

        <section className="workspace-editor">
          <CodeRunner
            question={question}
            onSubmit={handleSubmit}
            submitting={submitting}
          />

          {(submissionError || submission) && (
            <section className="submission-result">
              {submissionError && (
                <p className="submission-error">{submissionError}</p>
              )}

              {submission && (
                <>
                  <h3>Submission Result</h3>
                  <p>
                    <strong>Status:</strong>{" "}
                    {statusLabels[currentStatus] || submission.status}
                  </p>

                  {(currentStatus === "pending" ||
                    currentStatus === "running") && (
                    <p>Evaluating your code against the test cases...</p>
                  )}

                  {FINAL_STATUSES.includes(currentStatus) && (
                    <p>
                      <strong>Test Cases Passed:</strong>{" "}
                      {submission.passedTestCases ?? 0} /{" "}
                      {submission.totalTestCases ?? 0}
                    </p>
                  )}

                  {submission.executionTime > 0 && (
                    <p>
                      <strong>Execution Time:</strong>{" "}
                      {submission.executionTime} ms
                    </p>
                  )}

                  {submission.errorMessage && (
                    <pre>{submission.errorMessage}</pre>
                  )}

                  {isAccepted && (
                    <p className="submission-success">All test cases passed!</p>
                  )}
                </>
              )}
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

export default QuestionPage;
