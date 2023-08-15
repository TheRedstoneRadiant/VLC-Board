const errorBox = document.getElementById("error-box");
const errorElement = document.getElementById("error");

const displayErrorMessage = (error) => {
  errorElement.innerHTML = error;
  errorBox.style.display = "block";
};

const closeErrorBox = () => {
  errorBox.style.display = "none";
};
