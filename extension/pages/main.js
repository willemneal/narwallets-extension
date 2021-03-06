import * as d from "../util/document.js"
import * as c from "../util/conversions.js"
import * as global from "../data/global.js"
import * as Network from "../data/Network.js"
import { Account, ExtendedAccountData } from "../data/Account.js"
import { show as AccountSelectedPage_show } from "./account-selected.js"

//--- content sections at MAIN popup.html
export const WELCOME_NEW_USER = "welcome-new-user-page"
export const CREATE_PASS = "create-pass"

export const UNLOCK = "unlock"

export const MAIN = "main-page"
export const ADD_ACCOUNT = "add-account"
export const IMPORT_OR_CREATE = "import-or-create"


export const ACCOUNTS_LIST = "accounts-list"
export const ACCOUNT_ITEM_TEMPLATE = "account-item-template"
export const ACCOUNT_ITEM = "account-item"

let draggingEl/*:HTMLElement*/;
function accountItem_drag(ev/*:Event*/) {
  ev.preventDefault()
  if (!draggingEl) {
    //console.log("start")
    draggingEl = ev.target /*+as HTMLElement+*/;
    if (draggingEl) draggingEl.classList.add("invisible")
    new d.All("li.account-item").toggleClass("unselectable")
  }
}

function accountItem_dragOver(ev/*:Event*/) {
  ev.preventDefault(); //allow drop
  //console.log("over")
  //@ts-ignore
  if (ev.target.classList.contains("account-item")) {
    //@ts-ignore
    draggingEl.parentNode.insertBefore(draggingEl, ev.target)
    //console.log("over")
  }
}
function total_dragOver() {
  if (draggingEl && draggingEl.parentNode) draggingEl.parentNode.appendChild(draggingEl)

}
// function accountItem_dragEnter(ev/*:Event*/){
//   //@ts-ignore
//   if (ev.target.classList.contains("account-item")){
//     //console.log("enter")
//     //ev.target.classList.add("dragover")
//   }
// }
// function accountItem_dragLeave(ev/*:Event*/){
//   //@ts-ignore
//   if (ev.target.classList.contains("account-item")){
//     //console.log("leave")
//     //ev.target.classList.remove("dragover")
//   }
// }
function accountItem_drop(ev/*:Event*/) {
  ev.preventDefault();
  //console.log("drop")
}
function accountItem_dragend(ev/*:Event*/) {
  //console.log("dragEnd")
  ev.preventDefault()
  d.all("li.account-item")
  draggingEl.classList.remove("invisible")
  draggingEl = undefined /*+as unknown as HTMLElement+*/;
  //save new order
  const accountLis = d.all("li.account-item")
  accountLis.toggleClass("unselectable")
  let n = 1;
  accountLis.elems.forEach((li) => {
    const accInfo = global.SecureState.accounts[Network.current][li.id]
    //console.log(n,accInfo.type,li.id)
    if (accInfo) accInfo.order = n++;
  })
  global.saveSecureState();
}

//--------------------------
function sortByOrder(a/*:ExtendedAccountData*/, b/*:ExtendedAccountData*/) {
  if (a.accountInfo.order > b.accountInfo.order) return 1;
  return -1;
}

//--------------------------
export function showMain() {

  d.hideErr()

  //logged and with no accounts? add one
  if (global.unlocked && global.getNetworkAccountsCount()==0) {
    d.showPage(IMPORT_OR_CREATE)
    return;
  }
  if (!global.unlocked) {
    d.showPage(UNLOCK)
    return;
  }

  d.clearContainer(ACCOUNTS_LIST);

  //get accounts, sort by accountInfo.order and show as LI
  const accountsRecord = global.SecureState.accounts[Network.current]
  const list/*:ExtendedAccountData[]*/ = []
  for (let key in accountsRecord) {
    list.push(new ExtendedAccountData(key, accountsRecord[key]))
  }
  list.sort(sortByOrder);
  //debug 
  //for(let item of list) console.log(item.accountInfo.order,item.accountInfo.type, item.name)
  
  d.populateUL(ACCOUNTS_LIST, ACCOUNT_ITEM_TEMPLATE, list)

  let total = 0;
  //connect all item to accountItemClicked
  document.querySelectorAll("#accounts-list .account-item")
  .forEach((item) => {
    item.addEventListener("click", accountItemClicked)
    //item.addEventListener("dragstart", accountItem_dragStart)
    item.addEventListener("drag", accountItem_drag)
    //item.addEventListener("dragenter", accountItem_dragEnter)
    item.addEventListener("dragover", accountItem_dragOver)
    //item.addEventListener("dragleave", accountItem_dragLeave)
    item.addEventListener("drop", accountItem_drop)
    item.addEventListener("dragend", accountItem_dragend)
    //@ts-ignore
    item.draggable = true
    let balanceNum = 0;
    try {
      balanceNum = c.toNum(d.getChildText(item, ".balance"))
    } catch { balanceNum = 0 }
    if (isNaN(balanceNum)) balanceNum = 0;
    total += balanceNum;
  });


  //show total
  const totalEl = new d.El("#main-page .balance.total");
  totalEl.innerText = c.toStringDec(total);
  d.qs("#main-page .total-row").el.addEventListener("dragover", total_dragOver)

  d.showPage(MAIN)

}

//---------------------------------------------------
//-- account item clicked => account selected Page --
//---------------------------------------------------
export function accountItemClicked(ev/*:Event*/) {
  if (ev.target && ev.target instanceof HTMLElement) {
    const li = ev.target.closest("li")
    if (li) {
      const accName = li.id // d.getClosestChildText(".account-item", ev.target, ".name");
      if (!accName) return;
      AccountSelectedPage_show(accName);
    }
  }
}

