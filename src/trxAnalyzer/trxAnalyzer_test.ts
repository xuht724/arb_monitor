import { 
    http,
    createPublicClient,
    numberToBytes,
} from 'viem';
import { mainnet } from "viem/chains";
import { TrxAnalyzer } from './trxAnalyzer';
import { HTTP_NODE_URL } from '../config';

async function main(){
    const publicClient = createPublicClient({
        chain: mainnet,
        transport: http(HTTP_NODE_URL),
    });
    //let blockNumber = await publicClient.getBlockNumber();

    // for(let i = 19317659n; i < 19318659n; i += 1n){
    //     const blocks = await TrxAnalyzer.batchGetBlock(i, i + 1n);
    //     const trxReceipts = await TrxAnalyzer.batchGetTrxReceipt(blocks);
    //     for(let j = 0; j < trxReceipts.length; j++)
    //         await TrxAnalyzer.analyse(i + BigInt(j), trxReceipts[j]);
    // }

    const data = TrxAnalyzer.loadData("src/trxAnalyzerResult_19317659+1000.json");
    for(let i = 19317659n; i < 19318659n; i += 1n){
        const blockResult = data[i.toString()];
        if(blockResult["arbtrx"].length > 0){
            const blocks = await TrxAnalyzer.batchGetBlock(i, i + 1n);
            const trxReceipts = await TrxAnalyzer.batchGetTrxReceipt(blocks);
            for(let j = 0; j < trxReceipts.length; j++)
                await TrxAnalyzer.analyse(i + BigInt(j), trxReceipts[j]);
        }
    }

    //getBribeRateDistribution("src/trxAnalyzerResult.json", 19317659n, 19318659n);
}

function getBribeRateDistribution(path: string, startBlock: bigint, endBlock: bigint){
    const data = TrxAnalyzer.loadData(path);
    let bribeRateDistribution = Array(13).fill(0);
    let bribeRate = [];
    for(let i = startBlock; i < endBlock; i += 1n){
        const blockResult = data[i.toString()];
        if(blockResult == undefined) continue;
        if(blockResult["arbtrx"].length > 0){
            for(let arbtrx of blockResult["arbtrx"]){
                if(0 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.1)
                    bribeRateDistribution[1]++;
                else if(0.1 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.2)
                    bribeRateDistribution[2]++;
                else if(0.2 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.3)
                    bribeRateDistribution[3]++;
                else if(0.3 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.4)
                    bribeRateDistribution[4]++;
                else if(0.4 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.5)
                    bribeRateDistribution[5]++;
                else if(0.5 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.6)
                    bribeRateDistribution[6]++;
                else if(0.6 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.7)
                    bribeRateDistribution[7]++;
                else if(0.7 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.8)
                    bribeRateDistribution[8]++;
                else if(0.8 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.9)
                    bribeRateDistribution[9]++;
                else if(0.9 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.95)
                    bribeRateDistribution[10]++;
                else if(0.95 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 1)
                    bribeRateDistribution[11]++;
                else if(arbtrx["bribeRate"] > 1)
                    bribeRateDistribution[12]++;
                else bribeRateDistribution[0]++;
                if(arbtrx["bribeRate"] > 0) bribeRate.push(arbtrx["bribeRate"]);
            }
        }
    }
    console.log("Bribe Rate Distribution: ");
    console.log("0 < bribeRate <= 0.1: ", bribeRateDistribution[1]);
    console.log("0.1 < bribeRate <= 0.2: ", bribeRateDistribution[2]);
    console.log("0.2 < bribeRate <= 0.3: ", bribeRateDistribution[3]);
    console.log("0.3 < bribeRate <= 0.4: ", bribeRateDistribution[4]);
    console.log("0.4 < bribeRate <= 0.5: ", bribeRateDistribution[5]);
    console.log("0.5 < bribeRate <= 0.6: ", bribeRateDistribution[6]);
    console.log("0.6 < bribeRate <= 0.7: ", bribeRateDistribution[7]);
    console.log("0.7 < bribeRate <= 0.8: ", bribeRateDistribution[8]);
    console.log("0.8 < bribeRate <= 0.9: ", bribeRateDistribution[9]);
    console.log("0.9 < bribeRate <= 0.95: ", bribeRateDistribution[10]);
    console.log("0.95 < bribeRate <= 1: ", bribeRateDistribution[11]);
    console.log("1 < bribeRate: ", bribeRateDistribution[12]);
    console.log("Unknown: ", bribeRateDistribution[0]);
}

main();