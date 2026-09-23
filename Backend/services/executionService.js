const PISTON_API_URL =
  process.env.PISTON_API_URL || "https://emkc.org/api/v2/piston";

// language name -> Piston language identifier
const languageMap = {
  javascript: "javascript",
  python: "python",
  java: "java",
  cpp: "cpp",
  c: "c",
};

const isLanguageSupported = (language) =>
  Object.prototype.hasOwnProperty.call(languageMap, language);

const executeCode = async ({ language, code, input = "" }) => {
  const pistonLanguage = languageMap[language];

  const payload = {
    language: pistonLanguage,
    version: "*", // "*" = latest available version Piston has for this language
    files: [{ content: code }],
    stdin: input,
  };

  const response = await fetch(`${PISTON_API_URL}/execute`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(
      `Piston request failed: ${response.status} ${body}`,
    );
    error.code = "PISTON_REQUEST_FAILED";
    throw error;
  }

  const result = await response.json();
  const { compile, run } = result;

  let statusDescription = "Accepted";
  if (compile && compile.code !== 0) {
    statusDescription = "Compile Error";
  } else if (run.signal === "SIGKILL" || run.signal === "SIGTERM") {
    statusDescription = "Time Limit Exceeded";
  } else if (run.code !== 0) {
    statusDescription = "Runtime Error";
  }

  return {
    statusId: null, // Piston has no numeric status code like Judge0 — statusDescription is the source of truth here
    statusDescription,
    stdout: run.stdout || "",
    stderr: run.stderr || "",
    compileOutput: compile ? compile.stderr || compile.output || "" : "",
    time: null,
    memory: null,
  };
};

module.exports = { executeCode, isLanguageSupported, languageMap };
