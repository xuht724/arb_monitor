export class TarjanStronglyConnectedComponent{
    private time: number = 0;
    private visitedTime = new Map<string, number>();
    private lowTime = new Map<string, number>();
    private stack: string[] = [];
    private visited = new Set();
    private result: string[][] = [];
    private graph = new Map<string, string[]>();

    public scc(graph: Map<string, string[]>){
        this.graph = graph;
        this.time = 0;
        this.visitedTime = new Map<string, number>();
        this.lowTime = new Map<string, number>();
        this.stack = [];
        this.visited = new Set();
        this.result = [];

        for(let token of graph.keys()){
            if(this.visited.has(token)) continue;
            this.sccUtil(token);
        }
        return this.result;
    }

    private sccUtil(token: string){
        this.visited.add(token);
        this.visitedTime.set(token, this.time);
        this.lowTime.set(token, this.time);
        this.time++;
        this.stack.push(token);

        let peers = this.graph.get(token)!;
        if(peers != undefined){
            for(let peer of peers){
                if(!this.visited.has(peer)){
                    this.sccUtil(peer);
                    let newvalue = Math.min(this.lowTime.get(token)!, this.lowTime.get(peer)!);
                    this.lowTime.set(token, newvalue);
                }
                else if(this.stack.includes(peer)){
                    let newvalue = Math.min(this.lowTime.get(token)!, this.visitedTime.get(peer)!);
                    this.lowTime.set(token, newvalue);
                }
            }
        }

        if(this.visitedTime.get(token) == this.lowTime.get(token)){
            let stronglyConnectedComponenet = [this.stack[0]];
            let i = 1;
            for(; i < this.stack.length; i++){
                stronglyConnectedComponenet.push(this.stack[i]);
                if(this.stack[i] == this.stack[0]) break;
            }
            this.stack = this.stack.slice(i + 1);
            this.result.push(stronglyConnectedComponenet);
        }
    }
}