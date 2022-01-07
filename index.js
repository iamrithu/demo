document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("#login");
  const createAccountForm = document.querySelector("#createAccount");

  document
    .querySelector("#linkCreateAccount")
    .addEventListener("click", (e) => {
      e.preventDefault();
      loginForm.classList.add("form--hidden");
      createAccountForm.classList.remove("form--hidden");
    });

  document.querySelector("#linkLogin").addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.classList.remove("form--hidden");
    createAccountForm.classList.add("form--hidden");
  });
  document.querySelector("#register_button").addEventListener("click", (e) => {
    e.preventDefault();
    var data = {
      first_name: document.getElementById("firstname").value,
      last_name: document.getElementById("lastname").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password"),
    };
    console.log(data);
    axios.post(" https://localhost:4000/register", data).then((res) => {
      console.log("data added succesfully");
    });
  });

  document.querySelector("#login_button").addEventListener("click", (e) => {
    e.preventDefault();
    if (
      document.getElementById("l_email").value === "tanyac" &&
      document.getElementById("l_password").value === "123Axiom"
    ) {
      document.getElementById("l_email").value = "";
      document.getElementById("l_password").value = "";
      document.getElementById("l_email").style.border = "1px solid green";
      document.getElementById("l_password").style.border = "1px solid green";
      window.location.href = "./dashboard.html";
    } else {
      document.getElementById("l_email").value = "";
      document.getElementById("l_password").value = "";
      document.getElementById("l_email").style.border = "1px solid red";
      document.getElementById("l_password").style.border = "1px solid red";
      document.getElementById("message").innerText = "Invalid Email & Password";
    }
  });
});
