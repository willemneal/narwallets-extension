import * as d from "../common+ts.js"
import * as global from "../data/global+ts.js"
import { isValidEmail } from "../util/email+ts.js"

const EMAIL = "email"
const PASS = "pass"
const PASS_CONFIRM = "pass-confirm"
const AGREE_CHECK = "agree-check"
const CREATE_USER = "create-user"
const IMPORT_OR_CREATE = "import-or-create"

function agreeCheckboxClicked(ev /*:Event*/) {
  //enable create button when terms accepted
  const chkBox = ev.target /*+as HTMLInputElement+*/
  d.textById(CREATE_USER).disabled = !chkBox.checked;
}

function createClicked(ev /*:Event*/) {
  try{
  ev.preventDefault();

  const email = d.textById(EMAIL).value;
  const password = d.textById(PASS).value;
  const confirm = d.textById(PASS_CONFIRM).value;
  const agree = d.textById(AGREE_CHECK);

  let err;
  if (!isValidEmail(email)) {
    err = "Invalid email";
  }
  else if (!password || password.length < 6) {
    err = "password must be at least 6 characters long"
  }
  else if (!confirm || confirm != password) {
    err = "passwords don't match"
  }
  else if (!agree.checked) {
    err = "Please agree to the Terms of Use"
  }

  if (err) {
    d.showErr(err);
    return;
  }

  if (global.State.usersList.includes(email)){
    d.showErr("User already exists")
    d.showPage("unlock");  
    return;
  }

  //Create SecureState store hashedPass
  global.State.currentUser=email;
  global.createSecureState(password);

  //save new user in usersList
  global.State.usersList.push(email);
  global.saveState()

  d.showPage(IMPORT_OR_CREATE);

  }
  catch(ex){
    d.showErr(ex.message);
  }
}

// on document load
export function addListeners() {

  d.onClickId(AGREE_CHECK, agreeCheckboxClicked);
  d.onClickId(CREATE_USER, createClicked);

}
