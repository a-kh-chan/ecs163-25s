// This dashboard explores how student alcohol consumption relates to their school performance. 
// extending on from homework #2.
// code adapted from https://observablehq.com/@d3/multitouch for mouse interactivity + tooltops
//code adapted from https://observablehq.com/@d3/brushable-parallel-coordinates?collection=@d3/d3-brush for brushing
// used chat gpt to help debug + figure out small details. 
const width = window.innerWidth;
const height = window.innerHeight;

// creating svg container for all visualizations
const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

const marginTop = 100;
const marginRight = 30;
const marginBottom = 50;
const marginLeft = 60;

const scatterWidth = 500, scatterHeight = 300;

// load data from csv, converting values to numbers
d3.csv("student-mat.csv").then(data => {
  data.forEach(d => {
    d.G1 = +d.G1;
    d.G2 = +d.G2;
    d.G3 = +d.G3;
    d.Walc = +d.Walc;
    d.Dalc = +d.Dalc;
    d.studytime = +d.studytime;
    d.failures = +d.failures;
    d.absences = +d.absences;
  });

  // store brushes and interactions
  let activeBrushes = {};
  const brushes = {};

  // visualization #1: parallel coordinates plot
  // this plot compares student performance and behavior across multiple metrics.
  // added interactive brushing to filter records by value ranges across axes.
 
  function makeParallelCoordPlot(data) {
    const parallelKeys = ["G1", "G2", "G3", "Walc", "Dalc", "studytime", "failures", "absences"];
    const pcWidth = width - 100, pcHeight = 300;

    const pc = svg.append("g").attr("transform", `translate(50, 50)`);

    // y-scale for each dimension
    const yScales = {};
    parallelKeys.forEach(key => {
      yScales[key] = d3.scaleLinear()
        .domain(d3.extent(data, d => d[key]))
        .range([pcHeight, 0]);
    });

    // x-scale positions for each axis
    const x = d3.scalePoint().domain(parallelKeys).range([0, pcWidth]);

    // line generator for each student
    function path(d) {
      return d3.line()(parallelKeys.map(p => [x(p), yScales[p](d[p])]));
    }

    // draw line for each student, color by final grade
    const lines = pc.selectAll(".line")
      .data(data)
      .enter().append("path")
      .attr("class", "line")
      .attr("d", path)
      .attr("stroke", d => d3.interpolateRdYlGn(d.G3 / 20))
      .attr("fill", "none")
      .attr("opacity", 0.4);

    // draw axis for each key
    pc.selectAll(".axis")
      .data(parallelKeys)
      .enter().append("g")
      .attr("transform", d => `translate(${x(d)}, 0)`)
      .each(function(d) {
        d3.select(this).call(d3.axisLeft(yScales[d]));
      })
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", -10)
      .text(d => d)
      .style("fill", "black");

    // add brushing for interactive selection
    pc.selectAll(".brush")
      .data(parallelKeys)
      .enter().append("g")
      .attr("class", "brush")
      .attr("transform", d => `translate(${x(d)}, 0)`)
      .each(function(dimension) {
        const brush = d3.brushY()
          .extent([[-20, 0], [20, pcHeight]])
          .on("brush end", function(event) {
            if (!event.selection) delete activeBrushes[dimension];
            else activeBrushes[dimension] = event.selection;

            // update line opacity based on active brushes
            lines.transition().duration(200).style("opacity", function(row) {
              return parallelKeys.every(k => {
                if (!activeBrushes[k]) return true;
                const [y0, y1] = activeBrushes[k];
                const val = yScales[k](row[k]);
                return val >= y0 && val <= y1;
              }) ? 0.8 : 0.1;
            });
          });

        brushes[dimension] = brush;
        d3.select(this).call(brush);
      });

    // title for the overview
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .text("Student Performance Overview");

    // gradient legend for G3 color encoding
    svg.append("defs").append("linearGradient")
      .attr("id", "grad")
      .selectAll("stop")
      .data([
        { offset: "0%", color: d3.interpolateRdYlGn(0) },
        { offset: "100%", color: d3.interpolateRdYlGn(1) }
      ])
      .enter().append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);

    svg.append("rect")
      .attr("x", 50)
      .attr("y", 370)
      .attr("width", 200)
      .attr("height", 10)
      .style("fill", "url(#grad)");

    svg.append("text").attr("x", 50).attr("y", 390).text("Low G3").style("font-size", "10px");
    svg.append("text").attr("x", 250).attr("y", 390).text("High G3").style("font-size", "10px").attr("text-anchor", "end");
  }


  // visualization #2: scatter plot
  // this scatter plot shows the correlation between weekend alcohol use and final grades.
  // the color of each point reflects study time.
  // added tooltips and visual highlighting on hover to offer more information.
  function makeScatterPlot() {
    const scatter = svg.append("g")
      .attr("transform", `translate(${marginLeft}, ${300 + 150})`);

    const xScatter = d3.scaleLinear().domain(d3.extent(data, d => d.Walc)).range([0, scatterWidth]);
    const yScatter = d3.scaleLinear().domain([0, d3.max(data, d => d.G3)]).range([scatterHeight, 0]);

    scatter.append("g").attr("transform", `translate(0, ${scatterHeight})`).call(d3.axisBottom(xScatter));
    scatter.append("g").call(d3.axisLeft(yScatter));

    const scatterGroup = scatter.append("g");

    // draw data points
    scatterGroup.selectAll("circle")
      .data(data)
      .enter().append("circle")
      .attr("cx", d => xScatter(d.Walc))
      .attr("cy", d => yScatter(d.G3))
      .attr("r", 4)
      .attr("fill", d => d3.interpolateBlues(d.studytime / 4))
      .on("mouseover", function(event, d) {
        // show tooltip and enlarge
        d3.select("#tooltip")
          .style("opacity", 1)
          .html(`Walc: ${d.Walc}<br>G3: ${d.G3}<br>Studytime: ${d.studytime}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
        d3.select(this).attr("r", 8).attr("stroke", "black").attr("stroke-width", 1.5);
      })
      .on("mouseout", function() {
        // hide tooltip
        d3.select("#tooltip").style("opacity", 0);
        d3.select(this).attr("r", 4).attr("stroke", "none");
      });

    // x axis label
    scatter.append("text")
      .attr("x", scatterWidth / 2)
      .attr("y", scatterHeight + 40)
      .attr("text-anchor", "middle")
      .text("Weekend Alcohol Consumption");

      // y axis label
    scatter.append("text")
      .attr("x", -scatterHeight / 2)
      .attr("y", -35)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Final Grade");
      // title
    svg.append("text")
      .attr("x", marginLeft + (scatterWidth / 2))
      .attr("y", 300 + 130)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Final Grade vs. Weekend Alcohol Consumption");
  }


  // visualization #3: bar chart
  // compares average final grades of two schools (GP vs MS).
  // added animation on load and interactivity to filter other views.
  //clicking the bars will filter data from respectie school in the scatter plot as well as the parallel coord plot
  function makeBarChart() {
    const grouped = d3.rollups(data, v => d3.mean(v, d => d.G3), d => d.school);
    const barData = grouped.map(([key, val]) => ({ school: key, avgG3: val }));

    const bar = svg.append("g").attr("transform", `translate(${scatterWidth + 220}, ${300 + 150})`);
    const xBar = d3.scaleBand().domain(barData.map(d => d.school)).range([0, 300]).padding(0.2);
    const yBar = d3.scaleLinear().domain([0, d3.max(barData, d => d.avgG3)]).range([scatterHeight, 0]);
    const colorScale = d3.scaleOrdinal().domain(barData.map(d => d.school)).range(d3.schemeCategory10);

    bar.append("g").attr("transform", `translate(0, ${scatterHeight})`).call(d3.axisBottom(xBar));
    bar.append("g").call(d3.axisLeft(yBar));

    // animated bar growth + interaction to filter
    bar.selectAll("rect")
      .data(barData)
      .enter().append("rect")
      .attr("x", d => xBar(d.school))
      .attr("y", scatterHeight)
      .attr("width", xBar.bandwidth())
      .attr("height", 0)
      .attr("fill", d => colorScale(d.school))
      .on("click", function(event, d) {
        // bar click filters other views by school
        const selected = d.school;

        svg.selectAll(".line")
          .transition().duration(500)
          .attr("opacity", c => c.school === selected ? 0.8 : 0.05)
          .attr("stroke-width", c => c.school === selected ? 2 : 1);

        svg.selectAll("circle")
          .transition().duration(500)
          .attr("opacity", c => c.school === selected ? 1 : 0.1)
          .attr("r", c => c.school === selected ? 6 : 4);
      })
      .transition()
      .duration(1000)
      .delay((d, i) => i * 200)
      .attr("y", d => yBar(d.avgG3))
      .attr("height", d => scatterHeight - yBar(d.avgG3));

    // title for bar chart
    svg.append("text")
      .attr("x", scatterWidth + 370)
      .attr("y", 300 + 130)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Average Final Grade by School");
  }

  // run each visualization with staggered delay
  setTimeout(() => makeParallelCoordPlot(data), 1000);
  setTimeout(() => makeScatterPlot(), 2000);
  setTimeout(() => makeBarChart(), 3000);


  // reset all button functionality
  // clears all brushes and filters
  // this allows user to reset any filters. 
  document.getElementById("resetAll").addEventListener("click", () => {
    activeBrushes = {};

    // reset brush handles
    Object.keys(brushes).forEach(key => {
      svg.selectAll(".brush")
        .filter(dim => dim === key)
        .each(function() {
          d3.select(this).call(brushes[key].move, null);
        });
    });

    // reset line opacity and size
    svg.selectAll(".line")
      .transition().duration(500)
      .attr("opacity", 0.4)
      .attr("stroke-width", 1);

    // reset scatter circles
    svg.selectAll("circle")
      .transition().duration(500)
      .attr("opacity", 1)
      .attr("r", 4);
  });

}).catch(console.error);
