"use client"

import "./home.css"
// const checkbox = document.getElementById('terms');
//     const button = document.getElementById('createBtn');

//     checkbox.addEventListener('change', () => {
//       if (checkbox.checked) {
//         button.classList.add('active');
//         button.disabled = false;
//       } else {
//         button.classList.remove('active');
//         button.disabled = true;
//       }
//     });

export default function Home() {
  return (
    <>
      <nav>
        <div className="navbar">
          <div className="logo"><img id="LOGO" src="ULynk.svg" alt="" /></div>

          <ul className="navlinks">
            <li className="feature navlink"> Feature</li>
            <li className="about navlink">About</li>
            <li className="support navlink">Support</li>
            <li className="contactus navlink">Contact Us</li>
          </ul>

          <ul className="navbuttons">
            <button id="login">Login</button>
            <button id="joinasclub">Join as Club</button>
          </ul>

        </div>
      </nav>

      {/* ------------------ Login Section ------------------ */}

      <div className="loginsec">
        <div className="aboutsec">
          <div className="aboutcapsule">Welcome to the Future of Campus Life</div>
          <h1>Your Campus</h1>
            <h1>Reimagined</h1>
            <h2>A sophisticated platform connecting students, clubs, and support systems in one seamless experience.</h2>
        </div>



        <div className="logincardsec">
          <div className="card">
            <h1>Create Account</h1>
            <div className="subtitle">Join us today and get started</div>

            {/* Google Button */}
            <button className="social-btn">
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.2-.4-3.5z" />
                <path fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.7 16.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
                <path fill="#4CAF50"
                  d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.5 35.4 26.9 36 24 36c-5.3 0-9.8-3.3-11.4-7.9l-6.5 5C9.3 39.6 16.1 44 24 44z" />
                <path fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.3 5.5-6.1 7.1l6.2 5.2C38.8 37.1 44 31.5 44 24c0-1.3-.1-2.2-.4-3.5z" />
              </svg>
              <span>Sign in with Google</span>
            </button>

            {/* Facebook Button */}
            <button className="social-btn">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#1877F2"
                  d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1c0 6 4.4 11 10.1 11.9v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.3h3.4l-.5 3.5h-2.9V24C19.6 23.1 24 18.1 24 12.1z" />
              </svg>
              <span>Sign in with Facebook</span>
            </button>

            <div className="divider">OR</div>

            <label>Email Address</label>

            <div className="input-icon">
              <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16v12H4z" fill="none" />
                <path d="M4 6l8 7 8-7" fill="none" />
                <rect x="3" y="5" width="18" height="14" rx="2" ry="2" stroke="currentColor" fill="none" />
                <polyline points="3,7 12,13 21,7" stroke="currentColor" fill="none" />
              </svg>
              <input for="email" id="email" type="email" placeholder="Enter your email" required />
            </div>


            <label>Password</label>
            <div className="input-icon">
              <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" fill="none" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" fill="none" />
              </svg>
              <input for="password" id="password" type="password" placeholder="Create a password" required />
            </div>


            <div className="terms">
              <input type="checkbox" id="terms" />
              <span>I agree to the <a href="#">Terms</a> & <a href="#">Privacy Policy</a></span>
            </div>

            <button className="submit-btn" id="createBtn" disabled>Create Account</button>

            <div className="footer">
              Already have an account? <a href="#">Sign in</a>
            </div>
          </div>
        </div>



      </div>

    </>
  );
}
