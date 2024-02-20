import { TarjanStronglyConnectedComponent } from './TarjanStronglyConnectedComponent';

// Reference：https://github.com/mission-peace/interview/blob/master/src/com/interview/graph/AllCyclesInDirectedGraphJohnson.java
export class AllCyclesInDirectedGraphJohnson{
    private circles: string[][] = [];
    private blockedSet = new Set();
    private blockedMap = new Map<string, Set<string>>();
    private stack: string[] = [];
    private startAddresses: string[] = [];
    private addressMap = new Map<string, number>();

    public identifyCircle(graph: Map<string, string[]>){
        this.startAddresses = Array.from(graph.keys());
        this.addressMap = new Map<string, number>();
        for(let i = 0; i < this.startAddresses.length; i++){
            this.addressMap.set(this.startAddresses[i], i);
        }
        let startIndex = 0;
        let tarjan = new TarjanStronglyConnectedComponent();
        while(startIndex < this.startAddresses.length){
            let subGraph = this.createSubGraph(startIndex, graph);
            let sccs = tarjan.scc(subGraph);
            let [leastVertex, leastAddress] = this.leastIndexSCC(sccs, subGraph);
            if(leastVertex >= 0 && leastVertex < this.startAddresses.length){
                this.blockedSet.clear();
                this.blockedMap.clear();
                this.findCirclesInSCG(leastAddress, leastAddress, subGraph);
                startIndex = leastVertex + 1;
            }else break;
        }
        return this.circles;
    }

    public leastIndexSCC(sccs: string[][], subGraph: Map<string, string[]>): [number, string]{
        let min = Number.MAX_VALUE;
        let minaddress = '';
        for(let scc of sccs){
            if(scc.length == 1) continue;
            for(let token of scc){
                if(this.addressMap.get(token)! < min){
                    min = this.addressMap.get(token)!;
                    minaddress = token;
                }
            }
        }
        return [min, minaddress];
    }

    public findCirclesInSCG(startAddress: string, currentAddress: string, graph: Map<string, string[]>): boolean{
        let foundCircle = false;
        this.stack.push(currentAddress);
        this.blockedSet.add(currentAddress);
        for(let neighbor of graph.get(currentAddress)!){
            if(neighbor == startAddress){
                let circle: string[] = [];
                this.stack.push(startAddress);
                this.stack.forEach(value => circle.push(value));
                this.stack.pop();
                this.circles.push(circle);
                foundCircle = true;
            }
            else if(!this.blockedSet.has(neighbor)){
                let gotCircle: boolean = this.findCirclesInSCG(startAddress, neighbor, graph);
                foundCircle = foundCircle || gotCircle;
            }
        }
        if(foundCircle) this.unblock(currentAddress);
        else{
            for(let token of graph.get(currentAddress)!){
                let bSet = this.getBset(token);
                bSet.add(currentAddress);
            }
        }
        this.stack.pop();
        return foundCircle;
    }

    public unblock(address: string){
        this.blockedSet.delete(address);
        if(this.blockedMap.has(address)){
            let addSet = this.blockedMap.get(address);
            addSet?.forEach(add => {
                if(this.blockedSet.has(add)){
                    this.unblock(add);
                }
            });
            this.blockedMap.delete(address);
        }
    }

    public getBset(address: string): Set<string>{
        if(!this.blockedMap.has(address)) 
            this.blockedMap.set(address, new Set<string>());
        return this.blockedMap.get(address)!;
    }

    public createSubGraph(startIndex: number, graph: Map<string, string[]>){
        let subGraph = new Map<string, string[]>();
        const visited = this.startAddresses.slice(0,startIndex);
        for(let [token, addList] of graph.entries()){
            if(!visited.includes(token)){
                let tempList = [];
                for(let add of addList){
                    if(!visited.includes(add)) tempList.push(add);
                }
                subGraph.set(token, tempList);
            }
        }
        return subGraph;
    }
}