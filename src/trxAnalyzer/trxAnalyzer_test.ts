import { 
    http,
    createPublicClient,
} from 'viem';
import { mainnet, vechain } from "viem/chains";
import { TrxAnalyzer } from './trxAnalyzer';

async function main(){
    const HTTP_NODE_URL =
    "https://eth-mainnet.g.alchemy.com/v2/AmGhouGifK4fNQtvtdZI_wQX1pdgHxQo";
    const publicClient = createPublicClient({
        chain: mainnet,
        transport: http(HTTP_NODE_URL),
    });
    let testHashes = [
        '603761e4c2acdd3cef3a9e2e29f55009b18cdffd5696935bf59649910bb89943',
        'd9f9aad09530cc54bbff46e1847bea281f54862cb10a595ff2163b6fa44fcffd',
        '5739e2ab65ae48bbf60f89777a205d0056ddc0400f80034d05bb7526977cfad1',
        '6d9e998d9ef0b1c3920c72f64e29a066b9e8ac29fdb19cea66dbb283f09d5cc0'
    ];

    console.log("Start trxAnalyzer test");
    console.log("[2 rbitrage cycle]");
    let tx_receipt = await publicClient.getTransactionReceipt({
        hash: `0x${testHashes[3]}`
    });
    let swapEvents = TrxAnalyzer.analyseArb(tx_receipt);
    for(let event of swapEvents){
        console.log(JSON.stringify(event, (_, v) => typeof v === 'bigint' ? v.toString() : v));
    }
}

main();