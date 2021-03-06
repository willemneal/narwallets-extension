import * as d from "../util/document.js"
import * as c from "../util/conversions.js"
import * as global from "../data/global.js"
import * as Pages from "../pages/main.js"
import * as Network from "../data/Network.js"
import * as near from "../api/near-rpc.js"
import * as rpc from "../api/utils/json-rpc.js"
import { localStorageGet, localStorageGetAndRemove } from "../data/util.js"


/*+
type PoolInfo = {
      name:string;
      slashed: string;
      stake: string;
      stakeY: string;
      uptime: number;
      fee?: number;
}
+*/
function sortCompare(a/*:PoolInfo*/, b/*:PoolInfo*/) {
  if (a.stakeY > b.stakeY) return -1;
  return 1;
}


function clicked(name/*:string*/) {
  console.log(name);
  navigator.clipboard.writeText(name);
  d.showSuccess("Copied to clipboard: " + name)
  setTimeout(window.close, 600);
}

// ---------------------
async function displaySatakingPools() {

  d.showWait()
  try {

    const data = await near.getValidators()

    d.byId("net-name").innerText = Network.currentInfo().displayName;

    const list/*:PoolInfo[]*/ = []
    for (let item of data.current_validators) {
      list.push({
        name: item.account_id,
        slashed: item.is_slashed ? "yes" : "no",
        stake: c.ytonString(item.stake),
        stakeY: item.stake.padStart(50, "0"),
        uptime: Math.round(item.num_produced_blocks / item.num_expected_blocks * 100)
      })

    }

    list.sort(sortCompare);

    d.populateUL("list", "item-template", list)

    //query fees
    for (let item of data.current_validators) {
      near.getStakingPoolFee(item.account_id) //async get fees
        .then((fee) => {
          //debug
          if (item.account_id.indexOf("node0") != -1) {
            console.log(fee)
          }
          const elem = d.byId(item.account_id)
          if (fee >= 50) elem.classList.add("hidden") //bye bye 

          const feeSpan = d.byId(item.account_id + "-fee")
          feeSpan.innerText = fee.toString();
          const feeBox = feeSpan.parentElement;
          if (feeBox) {
            if (fee >= 30) feeBox.classList.add("red")
            if (fee >= 5) feeBox.classList.add("yellow")
            if (fee <= 5 && fee >= 0.5) feeBox.classList.add("green")
          }
          if (fee > 0 && fee < 50) {
            const button/*+:HTMLElement|null+*/ = elem.querySelector("button")
            if (button) {
              button.addEventListener("click", () => { clicked(item.account_id) })
              button.classList.remove("hidden");
            }
          }
        })
        .catch((ex) => {
          console.error(ex)
          //no contract on account_id
          const elem = d.byId(item.account_id)
          elem.classList.add("hidden") //bye bye 
        })
    }

  }
  catch (ex) {
    d.showErr(ex.message)
  }
  finally {
    d.hideWait()
  }
}

// ---------------------
// DOM Loaded - START
// ---------------------
async function init() {
  try {
    rpc.addHeader("mode","no-cors")
    const selectedNetwork = await localStorageGetAndRemove("selectedNetwork")
    if (selectedNetwork) Network.setCurrent(selectedNetwork);
    displaySatakingPools();
  } 
  catch (ex) {
    d.showErr(ex.message);
  }
}

document.addEventListener('DOMContentLoaded', init);

