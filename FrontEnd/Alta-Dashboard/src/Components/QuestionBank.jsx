import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./QuestionBank.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const TOPIC_OPTIONS = [
  "All Topics",
  "Arrays",
  "Strings",
  "Hash Table",
  "Dynamic Programming",
  "Math",
  "Two Pointers",
  "Binary Search",
  "Tree",
  "Graph",
];

const QuestionBank = () => {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("All Topics");

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const params = new URLSearchParams();
      if (difficulty !== "all") params.append("difficulty", difficulty);
      if (status !== "all") params.append("status", status);
      if (selectedTopic !== "All Topics") params.append("topic", selectedTopic);
      if (search.trim()) params.append("search", search.trim());

      const url = `${API_URL}/api/questions${params.toString() ? `?${params.toString()}` : ""}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch questions");
      }

      const list = Array.isArray(data.questions)
        ? data.questions
        : Array.isArray(data.data)
          ? data.data
          : [];

      setQuestions(list);
    } catch (err) {
      setError(err.message || "Something went wrong fetching questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchQuestions();
    }, 250);

    return () => clearTimeout(handler);
  }, [search, difficulty, status, selectedTopic]);

  return (
    <div className="question-bank-page">
      <div className="question-bank-header">
        <div>
          <h1>Practice Question Bank</h1>
          <p>Sharpen your problem solving and coding interview skills.</p>
        </div>

        <div className="header-actions">
          <span className="question-count">
            {questions.length} Question{questions.length === 1 ? "" : "s"}
          </span>
          <button
            className="solve-button"
            style={{ background: "#475569" }}
            onClick={() => navigate("/student")}
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search problems by title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <select
          className="filter-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="solved">Solved</option>
          <option value="unsolved">Unsolved</option>
        </select>

        <div className="filter-pills">
          {TOPIC_OPTIONS.map((topic) => (
            <button
              key={topic}
              type="button"
              className={`filter-pill ${selectedTopic === topic ? "active" : ""}`}
              onClick={() => setSelectedTopic(topic)}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="question-error">{error}</div>}

      {loading ? (
        <div className="empty-questions">
          <h2>Loading questions...</h2>
          <p>Applying filters and retrieving question list.</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="empty-questions">
          <h2>No questions found</h2>
          <p>Try clearing your search query or selecting different filters.</p>
        </div>
      ) : (
        <div className="question-list">
          {questions.map((q) => (
            <div key={q._id || q.id} className="question-card">
              <div className="question-card-content">
                <div className="question-card-top">
                  <h2>{q.title}</h2>
                  {q.isSolved && (
                    <span className="status-badge status-solved">
                      ✓ Solved
                    </span>
                  )}
                </div>

                <p className="question-description">
                  {q.description || "No description provided."}
                </p>

                <div className="question-meta">
                  <span
                    className={`difficulty difficulty-${(q.difficulty || "medium").toLowerCase()}`}
                  >
                    {q.difficulty || "Medium"}
                  </span>

                  {typeof q.acceptanceRate === "number" && (
                    <span className="acceptance-badge">
                      🎯 {q.acceptanceRate}% Acceptance
                    </span>
                  )}

                  {Array.isArray(q.topics) && q.topics.length > 0 && (
                    <div className="topics-wrap">
                      {q.topics.map((t, i) => (
                        <span key={i} className="topic-tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                className="solve-button"
                onClick={() =>
                  navigate(`/student/coding/${q._id || q.id}`)
                }
              >
                Solve Question
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
