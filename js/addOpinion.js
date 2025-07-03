/*
 * Created by Stefan Korecko, 2020-21
 * Opinions form processing functionality
 */
/*
This function works with the form:

<form id="opnFrm">
    <label for="nameElm">Your name:</label>
    <input type="text" name="login" id="nameElm" size="20" maxlength="50" placeholder="Enter your name here" required />
    <br><br>
    <label for="opnElm">Your opinion:</label>
    <textarea name="comment" id="opnElm" cols="50" rows="3" placeholder="Express your opinion here" required></textarea>
    <br><br>
    <input type="checkbox" id="willReturnElm" />
    <label for="willReturnElm">I will definitely return to this page.</label>
    <br><br>
    <button type="submit">Send</button>
</form>
 */
import { userFullName } from './routes.js';


export default function processOpnFrmData(event) {
    // 1. Запобігти стандартній поведінці форми
    event.preventDefault();
    const authorInput = document.querySelector("[name='author']");
    if (authorInput) {
      authorInput.value = userFullName?.fullName || "Anonymous";
    }

    // 2. Зчитати та обробити дані з форми
    const nopName = document.getElementById("nameElm").value.trim();
    const nopOpn = document.getElementById("opnElm").value.trim();
    const nopWillReturn = document.getElementById("willReturnElm").checked;

    // Додаткові дані для прикладу
    const nopEmail = document.getElementById("emailElm")?.value.trim() || "not provided";
    const nopUrl = document.getElementById("urlElm")?.value.trim() || "not provided";
    const nopImprovements = Array.from(
        document.querySelectorAll("input[name='improvements']:checked")
    ).map(input => input.value);

    // 3. Перевірка даних
    if (nopName === "" || nopOpn === "") {
        window.alert("Please, enter both your name and opinion");
        return;
    }

    // 4. Створення нового об'єкта відгуку
    const newOpinion = {
        name: nopName,
        email: nopEmail,
        opinion: nopOpn,
        createdDate: new Date().toLocaleDateString(),
        url: nopUrl,
        improvements: nopImprovements,
        willReturnMessage: nopWillReturn
            ? "I hope you will visit again!"
            : "Sorry to see you go."
    };

    // 5. Виведення нового відгуку у консоль
    console.log("New opinion:", JSON.stringify(newOpinion));

    // 6. Збереження у localStorage
    let opinions = [];

    if (localStorage.myTreesComments) {
        opinions = JSON.parse(localStorage.myTreesComments);
    }

    opinions.push(newOpinion);
    localStorage.myTreesComments = JSON.stringify(opinions);

    // 7. Перехід до сторінки відгуків
    window.location.hash = "#opinions";
}
