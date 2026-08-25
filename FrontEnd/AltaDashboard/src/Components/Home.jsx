import React from "react";
import "./Home.css";

function Home() {
  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon">&lt;/&gt;</div>
          <h2>
            Code<span>Forge</span> AI
          </h2>
        </div>

        <div className="nav-links">
          <a href="#Problems">Problems</a>
          <a href="#Contest">Contest</a>
          <input type="text" placeholder="search"></input>
        </div>

        <div className="nav-buttons">
          <button className="login-btn">Login</button>
          <button className="signup-btn">Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content">
          <div className="hero-badge">
            🚀 The smarter way to practice coding
          </div>

          <h1>
            Build Your Skills.
            <br />
            <span>Master the Code.</span>
          </h1>

          <p>
            Practice coding problems, participate in contests, track your
            progress, and improve your programming skills with CodeForge AI.
          </p>

          <div className="hero-buttons">
            <button className="primary-btn">Start Coding →</button>

            <button className="secondary-btn">Explore Problems</button>
          </div>

          <div className="hero-stats">
            <div>
              <h3>500+</h3>
              <p>Coding Problems</p>
            </div>

            <div>
              <h3>50+</h3>
              <p>Contests</p>
            </div>

            <div>
              <h3>10+</h3>
              <p>Languages</p>
            </div>
          </div>
        </div>

        {/* Code Card */}
        <div className="hero-code">
          <div className="code-window">
            <div className="window-header">
              <div className="window-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <p>solution.cpp</p>
            </div>

            <div className="code-content">
              <p>
                <span className="purple">#include</span>
                <span className="green"> &lt;iostream&gt;</span>
              </p>

              <br />

              <p>
                <span className="purple">using namespace</span> std;
              </p>

              <br />

              <p>
                <span className="blue">int</span>{" "}
                <span className="yellow">main</span>() {"{"}
              </p>

              <p className="indent">
                cout &lt;&lt; <span className="orange">"Keep Coding!"</span>;
              </p>

              <p className="indent">
                <span className="blue">return</span> 0;
              </p>

              <p>{"}"}</p>
            </div>

            <div className="code-result">
              <span>✓</span> Accepted
              <span className="runtime">32 ms</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      {/* <section className="features" id="features">
        <div className="section-heading">
          <p className="section-label">WHY CODEFORGE AI</p>

          <h2>
            Everything you need to
            <span> become better.</span>
          </h2>

          <p>
            A complete platform designed to help you practice, compete and
            improve.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">💻</div>

            <h3>Practice Coding</h3>

            <p>
              Solve coding problems with our interactive code editor and improve
              your problem-solving skills.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏆</div>

            <h3>Live Contests</h3>

            <p>
              Participate in coding contests and compete with other developers
              in real time.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>

            <h3>Track Progress</h3>

            <p>
              Monitor your performance, identify weak areas and see how your
              coding skills improve.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>

            <h3>AI Assistance</h3>

            <p>
              Get intelligent hints, question assistance and personalized
              feedback while learning.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta" id="about">
        <div>
          <h2>
            Ready to start your
            <span> coding journey?</span>
          </h2>

          <p>Create your account and start solving problems today.</p>

          <button className="primary-btn">Get Started →</button>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-logo">&lt;/&gt; CodeForge AI</div>

        <p>© 2026 CodeForge AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
