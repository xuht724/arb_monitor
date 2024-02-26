import { 
    Log, 
    decodeEventLog, 
    PublicClient,
    http,
    createPublicClient,
    getContract,
    getAddress,
    SetRpcUrlErrorType, 
} from 'viem';
import { mainnet } from "viem/chains";
import { TransferEvent } from '../eventDecoder/types/events'
import { SwapEvent, PoolType } from '../eventDecoder/constants/events'
import { EventDecoder } from '../eventDecoder/eventDecoder';
import { SqliteHelper } from '../sqliteHelper';
import { uniswapV2PoolABI } from '../abi/dex/uniswapLike/uniswapV2/uniV2Pool';
import { uniswapV3PoolABI } from '../abi/dex/uniswapLike/uniswapV3/uniV3Pool';

export class identifyBySwap{
    publicClient: PublicClient;
    sqliteHelper: SqliteHelper;
    v2PoolTokenMap: Map<string, string[]>;
    v3PoolTokenMap: Map<string, string[]>;

    constructor(HTTP_NODE_URL: string, sqlite_database: string) {
        this.publicClient = createPublicClient({
            chain: mainnet,
            transport: http(HTTP_NODE_URL),
        });
        this.sqliteHelper = new SqliteHelper(sqlite_database);
        this.v2PoolTokenMap = new Map<string, string[]>();
        this.v3PoolTokenMap = new Map<string, string[]>();
        this.loadPoolTokenMap();
    }

    public async loadPoolTokenMap(){
        const v2Edges = await this.sqliteHelper.getV2Edges();
        for(let edge of v2Edges){
            this.v2PoolTokenMap.set(edge.pairAddress, [edge.token0, edge.token1]);
        }
        const v3Edges = await this.sqliteHelper.getV3Edges();
        for(let edge of v3Edges){
            this.v3PoolTokenMap.set(edge.pairAddress, [edge.token0, edge.token1]);
        }
    }

    public async identifyArbBySwap(txReceipt: any, swapEvents: any[]): Promise<[boolean, string[][], bigint[]] | [boolean, undefined, undefined]>{
        let circles: any[][] = [], profits: bigint[] = [];
        let temp = [];
        let curFirstBlock = 0n;
        for(let swapEvent of swapEvents){
            if(temp.length == 0){
                temp.push([swapEvent]);
                curFirstBlock = swapEvent.blockNumber;
                continue;
            }
            let appendTo = false;
            const [curTokenIn, curTokenOut, curAmountIn, curAmountOut] = await this.getTokenAndAmount(swapEvent);
            if(curTokenIn == undefined) continue;

            for(let j = temp.length - 1; j >= 0; j--){
                const [lastTokenIn, lastTokenOut, lastAmountIn, lastAmountOut] = await this.getTokenAndAmount(temp[j][temp[j].length - 1]);
                const [firstTokenIn, firstTokenOut, firstAmountIn, firstAmountOut] = await this.getTokenAndAmount(temp[j][0]);
                if(lastTokenIn == undefined || firstTokenIn == undefined) continue;
                if(curAmountIn == lastAmountOut && curTokenIn == lastTokenOut){
                    temp[j].push(swapEvent);
                    appendTo = true;
                    if(curTokenOut == firstTokenIn){
                        circles.push(temp[j]);
                        profits.push(curAmountOut! - firstAmountIn!);
                        temp.splice(j, 1);
                    }
                    break;
                }
            }
            if(!appendTo) temp.push([swapEvent]);
        }
        if(circles.length > 0)
            return [true, circles, profits];
        else 
            return [false, undefined, undefined];
    }

    public async getTokenAndAmount(swapEvent: any): Promise<[string, string, bigint, bigint] | undefined[]>{
        let tokenIn, tokenOut, amountIn, amountOut;
        switch(swapEvent.poolType){
            case PoolType.UNISWAP_V2_LIKE_POOL: {
                let tokens: any = await this.getV2PoolTokens(swapEvent.address);
                if(swapEvent.amount0In != 0n){
                    amountIn = swapEvent.amount0In;
                    amountOut = swapEvent.amount1Out;
                    tokenIn = tokens[0];
                    tokenOut = tokens[1];
                }else{
                    amountIn = swapEvent.amount1In;
                    amountOut = swapEvent.amount0Out;
                    tokenIn = tokens[1];
                    tokenOut = tokens[0];
                }
                return [tokenIn, tokenOut, amountIn, amountOut];
            }
            case PoolType.UNISWAP_V3_LIKE_POOL: {
                let tokens: any = await this.getV3PoolTokens(swapEvent.address);
                if(swapEvent.amount0 > 0n){
                    amountIn = swapEvent.amount0;
                    amountOut = -swapEvent.amount1;
                    tokenIn = tokens[0];
                    tokenOut = tokens[1];
                }else{
                    amountIn = swapEvent.amount1;
                    amountOut = -swapEvent.amount0;
                    tokenIn = tokens[1];
                    tokenOut = tokens[0];
                }
                return [tokenIn, tokenOut, amountIn, amountOut];
            }
            default: return [undefined, undefined, undefined, undefined];
        }
    }

    public async getV2PoolTokens(pool: string): Promise<string[] | undefined>{
        let tokens = this.v2PoolTokenMap.get(pool);
        if(tokens == undefined){
            tokens = await this.multicallV2PoolInfo(pool);
            if(tokens != undefined)
                this.v2PoolTokenMap.set(pool, [tokens[0], tokens[1]]);
        }
        return tokens;
    }

    public async getV3PoolTokens(pool: string): Promise<string[] | undefined>{
        let tokens = this.v3PoolTokenMap.get(pool);
        if(tokens == undefined){
            tokens = await this.multicallV3PoolInfo(pool);
            if(tokens != undefined)
                this.v3PoolTokenMap.set(pool, [tokens[0], tokens[1]]);
        }
        return tokens;
    }

    public async multicallV2PoolInfo(pool: string): Promise<any[] | undefined>{
        const v2PoolContract = {
            address: pool,
            abi: uniswapV2PoolABI,
        } as const;
        let contracts: any[] = [
            {
                ...v2PoolContract,
                functionName: "token0",
            },
            {
                ...v2PoolContract,
                functionName: "token1",
            },
        ];
        let result = await this.publicClient.multicall({
            contracts: contracts,
        });
        if (result[0].status && result[1].status) {
            return [result[0].result, result[1].result];
        } else {
            return undefined;
        }
    }

    public async multicallV3PoolInfo(pool: string): Promise<any[] | undefined>{
        const v3PoolContract = {
            address: pool,
            abi: uniswapV3PoolABI,
        } as const;
        let contracts: any[] = [
            {
                ...v3PoolContract,
                functionName: "token0",
            },
            {
                ...v3PoolContract,
                functionName: "token1",
            },
        ];
        let result = await this.publicClient.multicall({
            contracts: contracts,
        });
        if (result[0].status && result[1].status) {
            return [result[0].result, result[1].result];
        } else {
            return undefined;
        }
    }
}