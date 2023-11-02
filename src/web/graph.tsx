import * as React from 'react';
// import vscode from './vscode';
import * as dag from 'd3-graphviz';
import * as d3 from 'd3'
import * as client from '../client';



export default function Graph() {

    const [dot, setDot] = React.useState("");
    const svgRef = React.useRef(null);

    // let state = vscode.getState();
    // if (!state?.dot) {
    //     vscode.setState({ dot: dot });
    // } else if (state.dot !== dot) {
    //     setDot(state.dot);
    // }

    client.send('/dot', res => {
        setDot(res);
    }, null)


    React.useEffect(() => {
        if (svgRef.current && dot) {
            dag.graphviz(svgRef.current)
                .renderDot(dot, () => {
                    var nodes = d3.selectAll(".node");
                    nodes.attr('cursor', 'pointer')
                    nodes.on("click", (el, e,) => {
                        console.log("click", el, e);
                        client.send("/open/range", () => { }, (e as { key: string }).key);
                    });
                })
        }
    }, [dot]);

    return (
        <div>
            <div ref={svgRef}></div>
        </div>
    );
}
