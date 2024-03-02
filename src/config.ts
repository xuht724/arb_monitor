// "https://eth-mainnet.g.alchemy.com/v2/AmGhouGifK4fNQtvtdZI_wQX1pdgHxQo"
// "https://mainnet.infura.io/v3/d562ab8be7824445a11dc8c7575552cd"
// "https://eth-mainnet.nodereal.io/v1/abf58db7a57847518733df4dd817bbbc"
// "https://sparkling-divine-tree.discover.quiknode.pro/614a2336889d86c106f4c654f769bfe26f833fe3/"
import * as dotenv from "dotenv";
const info = dotenv.config({ path: './.env' });

export const HTTP_NODE_URL = info.parsed!.NODESERVICE

export const sqlite_database = info.parsed!.SQLITEDATABASE;


// export const trxAnalyzerResultPath = "src/trxAnalyzerResult.json";