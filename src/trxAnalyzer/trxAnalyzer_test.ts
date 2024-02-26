import { 
    http,
    createPublicClient,
} from 'viem';
import { mainnet } from "viem/chains";
import { TrxAnalyzer } from './trxAnalyzer';
import { HTTP_NODE_URL } from '../config';

async function main(){
    const publicClient = createPublicClient({
        chain: mainnet,
        transport: http(HTTP_NODE_URL),
    });
    let blockNumber = await publicClient.getBlockNumber();
    // 1000 block, arb -> pool address -> n trx before has same pool
    //for(let i = blockNumber - 1000n; i < blockNumber; i++)
        TrxAnalyzer.analyse(11852437n);
}

main();