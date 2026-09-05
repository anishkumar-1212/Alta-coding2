import "./Account.css";

const Account = () => {
  return (
    <div className="account-page">
      <h1>My Account</h1>
      
      <div className="account-card">
        <div className="profile">
          <div className="avatar">A</div>

          <div>
            <h2>Anish Patel</h2>
            <p>anish@example.com</p>
          </div>
        </div>

        <hr />

        <div className="details">
          <div>
            <span>Name</span>
            <p>Anish Patel</p>
          </div>

          <div>
            <span>Email</span>
            <p>anish@example.com</p>
          </div>

          <div>
            <span>Phone</span>
            <p>+91 XXXXX XXXXX</p>
          </div>

          <div>
            <span>Account Type</span>
            <p>Customer</p>
          </div>
        </div>

        <button className="edit-btn">Edit Profile</button>
        <button className="logout-btn">Logout</button>
      </div>
    </div>
  );
};

export default Account;