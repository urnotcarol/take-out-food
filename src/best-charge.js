const loadAllItems = require("./items.js");
const loadPromotions = require("./promotions.js");

const ID_FIELD = "id";
const TYPE_FIELD = "type";
const REDUCTION_NAME = "满30减6元";
const HALF_PRICE_NAME = "指定菜品半价";

function find(collection, target, keyName) {
  let res = null;
  for (let elem of collection) {
    if (elem[keyName] === target) {
      res = elem;
      break;
    }
  }
  return res;
}

function formatIDs(inputs) {
  return inputs.map(elem => {
    let splited = elem.split(" x ");
    return ({id: splited[0], count: parseInt(splited[1])});
  });
}

function addOtherInfo(IDs) {
  const allItems = loadAllItems();
  return IDs.map(elem => {
    let itemInfo = find(allItems, elem.id, ID_FIELD);
    if (itemInfo) {
      elem.name = itemInfo.name;
      elem.price = itemInfo.price;
      elem.subTotal = itemInfo.price * elem.count;
    }
    return elem;
  });
}

function getReductionInfo(selectedItemsInfo) {
  const promotionInfo = loadPromotions();
  let res = {};
  res.name = REDUCTION_NAME;
  res.amount = 0;
  let sum = 0;
  if (find(promotionInfo, REDUCTION_NAME, TYPE_FIELD)) {
    selectedItemsInfo.forEach(item => {
      sum += item.price * item.count;
    });
  }
  if (sum >= 30) {
    res.amount = 6;
  }
  return res;
}

function getHalfPriceInfo(selectedItemsInfo) {
  const promotionInfo = loadPromotions();
  let res = {};
  res.name = HALF_PRICE_NAME;
  res.halfPriceNames = [];
  let amount = 0;
  if (infoObj = find(promotionInfo, HALF_PRICE_NAME, TYPE_FIELD)) {
    selectedItemsInfo.forEach(item => {
      if (infoObj.items.includes(item.id)) {
        res.halfPriceNames.push(item.name);
        amount += item.price / 2 * item.count;
      }
    });
  }
  res.amount = amount;
  return res;
}

function getOriginTotal(boughtItems, chosenPromotion) {
  let res = 0;
  boughtItems.forEach(item => {
    res += item.subTotal;
  });
  return res;
}

function getPrintText(receipt) {
  let res = "";

  res += "============= 订餐明细 =============\n";
  receipt.boughtItems.forEach(item => {
    res += `${item.name} x ${item.count} = ${item.subTotal}元\n`;
  });

  let promotionAmount = receipt.chosenPromotion.amount;
  if (promotionAmount > 0) {
    res += "-----------------------------------\n使用优惠:\n";
    if (receipt.chosenPromotion.name === REDUCTION_NAME) {
      res += `满30减6元，`;
    } else {
      res += `指定菜品半价(${receipt.chosenPromotion.halfPriceNames.join("，")})，`;
    }
    res += `省${promotionAmount}元\n`;
  }

  res += "-----------------------------------\n";
  res += `总计：${receipt.finalTotal}元\n`;
  res += "===================================";
  return res;
}

function bestCharge(selectedItems) {
  let receipt = {};
  let formatedIDs = formatIDs(selectedItems);
  receipt.boughtItems = addOtherInfo(formatedIDs);

  let reductionInfo = getReductionInfo(receipt.boughtItems);
  let halfPriceInfo = getHalfPriceInfo(receipt.boughtItems);

  if (reductionInfo.amount >= halfPriceInfo.amount) {
    receipt.chosenPromotion = reductionInfo;
  } else {
    receipt.chosenPromotion = halfPriceInfo;
  } 

  receipt.OriginTotal = getOriginTotal(receipt.boughtItems, receipt.chosenPromotion);
  receipt.finalTotal = receipt.OriginTotal - receipt.chosenPromotion.amount;

  return getPrintText(receipt);  
}

module.exports = bestCharge;