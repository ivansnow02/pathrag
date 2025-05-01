import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Graph = ({ data }) => {
  const svgRef = useRef(null);
  
  useEffect(() => {
    if (!data || !data.nodes || !data.edges || data.nodes.length === 0) {
      return;
    }
    
    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Set up SVG dimensions
    const width = 800;
    const height = 600;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);
    
    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.edges).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));
    
    // Create a group for the graph
    const g = svg.append('g');
    
    // Add zoom behavior
    svg.call(d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      }));
    
    // Define node colors based on type
    const color = d3.scaleOrdinal()
      .domain(['person', 'organization', 'event', 'geo', 'category', 'Unknown'])
      .range(['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#b07aa1']);
    
    // Create links
    const link = g.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(data.edges)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.weight || 1));
    
    // Create nodes
    const node = g.append('g')
      .selectAll('.node')
      .data(data.nodes)
      .join('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
    
    // Add circles to nodes
    node.append('circle')
      .attr('r', 10)
      .attr('fill', d => color(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);
    
    // Add labels to nodes
    node.append('text')
      .attr('dx', 12)
      .attr('dy', '.35em')
      .text(d => d.label)
      .attr('fill', '#fff');
    
    // Add tooltips
    node.append('title')
      .text(d => `${d.label}\nType: ${d.type}\n${d.description || ''}`);
    
    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data]);
  
  return (
    <div className="graph-container">
      <svg ref={svgRef} className="knowledge-graph"></svg>
    </div>
  );
};

export default Graph;
