import "./CodeRunner.css";
import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";

const languages = [
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "C++", value: "cpp" },
];

const defaultCode = {
  javascript: 'console.log("Hello, CodeForge!");',
  python: 'print("Hello, CodeForge!")',
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CodeForge!");
    }
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, CodeForge!" << endl;
    return 0;
}`,
};

const statusMap = {
  3: "Run Successful",
  4: "Execution Failed",
  5: "Time Limit Exceeded",
  6: "Compilation Error",
  7: "Runtime Error",
  8: "Runtime Error",
  9: "Runtime Error",
  10: "Runtime Error",
  11: "Runtime Error",
  12: "Runtime Error",
  13: "Internal Error",
  14: "Execution Error",
};

const normalizeOutput = (value = "") => value.replace(/\r\n/g, "\n").trim();

function CodeRunner({ question, onSubmit, submitting = false }) {
  const [language, setLanguage] = useState(
    // To set the default language as selected by the student and get them stored locally
    () => localStorage.getItem("codeforge-language") || "C++",
  );

  useEffect(() => {
    localStorage.setItem("codeforge-language", language);
  }, [language]);
  const [code, setCode] = useState(defaultCode.python);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("testcase");
  const [activeCase, setActiveCase] = useState(0);
  const [testCases, setTestCases] = useState([]);
  const [testCasesLoading, setTestCasesLoading] = useState(false);
  const [testCasesError, setTestCasesError] = useState("");
  const [caseResults, setCaseResults] = useState([]);
  const [testPanelHeight, setTestPanelHeight] = useState(230);

  useEffect(() => {
    let cancelled = false;

    const loadTestCases = async () => {
      const fallbackCase = {
        id: "question-sample",
        input: question?.sampleInput || "",
        expectedOutput: question?.sampleOutput || "",
        custom: false,
      };

      if (!question?._id) {
        setTestCases([fallbackCase]);
        setTestCasesLoading(false);
        return;
      }

      setTestCasesLoading(true);
      setTestCasesError("");

      try {
        const token = localStorage.getItem("token");
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";

        const response = await fetch(
          `${apiUrl}/api/test-cases/question/${question._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load test cases");
        }

        // Supports either a direct array or { data: [...] }.
        const result = Array.isArray(data) ? data : data.data;
        const samples = Array.isArray(result)
          ? result.filter((item) => item.visibility === "sample")
          : [];

        const cases = samples.length
          ? samples.map((item, index) => ({
              id: item._id || index + 1,
              input: item.input || "",
              expectedOutput: item.expectedOutput || "",
              custom: false,
            }))
          : [fallbackCase];

        if (!cancelled) {
          setTestCases(cases);
          setActiveCase(0);
        }
      } catch (err) {
        if (!cancelled) {
          setTestCases([fallbackCase]);
          setActiveCase(0);
          setTestCasesError(err.message || "Could not load test cases");
        }
      } finally {
        if (!cancelled) setTestCasesLoading(false);
      }
    };

    loadTestCases();

    return () => {
      cancelled = true;
    };
  }, [question?._id, question?.sampleInput, question?.sampleOutput]);

  const selectedCase = testCases[activeCase];
  const currentLanguage = languages.find((item) => item.value === language);

  const clearResult = () => {
    setOutput("");
    setError("");
    setStatus("");
  };

  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value;
    setLanguage(selectedLanguage);
    setCode(defaultCode[selectedLanguage]);
    clearResult();
  };

  const updateCase = (field, value) => {
    setTestCases((previous) =>
      previous.map((item, index) =>
        index === activeCase ? { ...item, [field]: value } : item,
      ),
    );
    clearResult();
  };

  const addTestCase = () => {
    const newCase = {
      id: `custom-${Date.now()}`,
      input: "",
      expectedOutput: "",
      custom: true,
    };

    setTestCases((previous) => {
      setActiveCase(previous.length);
      return [...previous, newCase];
    });

    setActiveTab("testcase");
    clearResult();
  };

  const removeTestCase = () => {
    if (!selectedCase?.custom) return;

    setTestCases((previous) =>
      previous.filter((_, index) => index !== activeCase),
    );
    setActiveCase(Math.max(0, activeCase - 1));
    clearResult();
  };

  const handleRun = async () => {
    if (!testCases.length) {
      setStatus("No test cases available");
      setActiveTab("result");
      return;
    }

    setLoading(true);
    setOutput("");
    setError("");
    setStatus("Running test cases...");
    setCaseResults([]);
    setActiveTab("result");

    try {
      const token = localStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";

      const results = [];

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];

        try {
          const response = await fetch(`${apiUrl}/api/execution/run`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              language,
              code,
              input: testCase.input,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Execution failed");
          }

          const result = data.result || {};
          const actualOutput = result.stdout || "";
          const expectedOutput = testCase.expectedOutput || "";

          let caseStatus =
            statusMap[result.statusId] ||
            result.statusDescription ||
            "Execution Finished";

          if (result.statusId === 3) {
            caseStatus =
              normalizeOutput(actualOutput) === normalizeOutput(expectedOutput)
                ? "Passed"
                : "Wrong Answer";
          }

          results.push({
            id: testCase.id,
            caseNumber: i + 1,
            input: testCase.input,
            expectedOutput,
            actualOutput,
            error: result.stderr || result.compileOutput || "",
            status: caseStatus,
          });
        } catch (err) {
          results.push({
            id: testCase.id,
            caseNumber: i + 1,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: "",
            error: err.message || "Execution failed",
            status: "Execution Failed",
          });
        }

        // Show progress as each case completes.
        setCaseResults([...results]);
      }

      const passed = results.filter((item) => item.status === "Passed").length;

      const allPassed = passed === results.length;

      setStatus(
        allPassed
          ? `All ${results.length} test cases passed`
          : `${passed} / ${results.length} test cases passed`,
      );

      setOutput("");
      setError("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="code-runner">
      <div className="code-runner-header">
        <select
          value={language}
          onChange={handleLanguageChange}
          disabled={loading}
          aria-label="Programming language"
        >
          {languages.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <div className="runner-actions">
          <button
            className="run-code-button"
            onClick={handleRun}
            disabled={loading || testCasesLoading}
          >
            {loading ? "Running..." : "Run"}
          </button>

          {onSubmit && (
            <button
              className="submit-code-button"
              onClick={() => onSubmit({ code, language })}
              disabled={loading || submitting}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </div>

      <div className="editor-container">
        <Editor
          height="calc(100vh - 390px)"
          language={currentLanguage.value}
          value={code}
          onChange={(value) => setCode(value || "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      <div
        className="test-panel-resize-handle"
        title="Drag to resize test panel"
        onMouseDown={(event) => {
          event.preventDefault();

          const startY = event.clientY;
          const startHeight = testPanelHeight;

          const onMove = (moveEvent) => {
            const delta = startY - moveEvent.clientY;
            setTestPanelHeight(
              Math.max(100, Math.min(500, startHeight + delta)),
            );
          };

          const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
          };

          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
      />

      <div className="test-panel" style={{ flexBasis: `${testPanelHeight}px` }}>
        <div className="test-panel-tabs">
          <button
            className={activeTab === "testcase" ? "active" : ""}
            onClick={() => setActiveTab("testcase")}
          >
            Testcase
          </button>

          <button
            className={activeTab === "result" ? "active" : ""}
            onClick={() => setActiveTab("result")}
          >
            Test Result
          </button>
        </div>

        {activeTab === "testcase" ? (
          <div className="testcase-panel">
            <div className="testcase-list">
              {testCases.map((item, index) => (
                <button
                  key={item.id}
                  className={`testcase-tab ${
                    activeCase === index ? "active" : ""
                  }`}
                  onClick={() => setActiveCase(index)}
                >
                  Case {index + 1}
                </button>
              ))}

              <button
                className="add-testcase-button"
                onClick={addTestCase}
                title="Add custom test case"
                aria-label="Add custom test case"
              >
                +
              </button>
            </div>

            {testCasesLoading ? (
              <p>Loading test cases...</p>
            ) : (
              selectedCase && (
                <div className="testcase-fields">
                  <label>
                    Input {selectedCase.custom ? "(Custom)" : "(Sample)"}
                    <textarea
                      value={selectedCase.input}
                      onChange={(event) =>
                        updateCase("input", event.target.value)
                      }
                      placeholder="Enter program input..."
                      spellCheck={false}
                    />
                  </label>

                  <label>
                    Expected output
                    <textarea
                      value={selectedCase.expectedOutput}
                      onChange={(event) =>
                        updateCase("expectedOutput", event.target.value)
                      }
                      placeholder="Enter expected output..."
                      spellCheck={false}
                    />
                  </label>

                  {selectedCase.custom && (
                    <button
                      className="remove-testcase-button"
                      onClick={removeTestCase}
                    >
                      Remove case
                    </button>
                  )}
                </div>
              )
            )}

            {testCasesError && (
              <p className="testcase-note">
                Could not load database test cases: {testCasesError}
              </p>
            )}

            <p className="testcase-note">
              Custom cases are for Run only. Submit uses official server-side
              test cases.
            </p>
          </div>
        ) : (
          <div className="test-result-panel">
            {loading && <p>Running test cases...</p>}

            {!loading && status && (
              <p
                className={`execution-status ${
                  status.startsWith("All ") ? "status-success" : "status-error"
                }`}
              >
                {status}
              </p>
            )}

            {caseResults.map((result) => (
              <div key={result.id} className="test-case-result">
                <h4>
                  Case {result.caseNumber} — {result.status}
                </h4>

                <p>Input</p>
                <pre>{result.input || "(empty)"}</pre>

                <p>Expected Output</p>
                <pre>{result.expectedOutput || "(empty)"}</pre>

                <p>Your Output</p>
                <pre>{result.actualOutput || "(empty)"}</pre>

                {result.error && (
                  <>
                    <p>Error</p>
                    <pre className="error-output">{result.error}</pre>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeRunner;
