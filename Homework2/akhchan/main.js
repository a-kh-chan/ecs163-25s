// This dashboard explores how student alcohol consumption relates to their school performance. 
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

// load data from csv, convertign values to numbers. 
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

// visualization #1: parallel coordinates plot
//this parallell coordinates plot was inteneded to compare several different key factors of student behavior and performance. 

  const parallelKeys = ["G1", "G2", "G3", "Walc", "Dalc", "studytime", "failures", "absences"];
  const pcWidth = width - 100, pcHeight = 300;

  const pc = svg.append("g")
    .attr("transform", `translate(50, 50)`);

//y-scale
  const yScales = {};
  parallelKeys.forEach(key => {
    yScales[key] = d3.scaleLinear()
      .domain(d3.extent(data, d => d[key]))
      .range([pcHeight, 0]);
  });

  //x scale
  const x = d3.scalePoint()
    .domain(parallelKeys)
    .range([0, pcWidth]);

    //generating path for each datapoint, used chat-gpt to help with the implementation of parallel coordinates plot
  function path(d) {
    return d3.line()(parallelKeys.map(p => [x(p), yScales[p](d[p])]));
  }

  //drawing lines for each student record
  pc.selectAll(".line")
    .data(data)
    .enter().append("path")
    .attr("class", "line")
    .attr("d", path)
    .attr("stroke", d => d3.interpolateRdYlGn(d.G3 / 20))
    .attr("fill", "none")
    .attr("opacity", 0.4);
    
    //adding vertical axis with respective labels
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

    //title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 25) // top of the SVG
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .text("Student Performance Overview");

        
//creating a legend
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

    //creatign color box
    svg.append("rect")
    .attr("x", 50)
    .attr("y", 370)
    .attr("width", 200)
    .attr("height", 10)
    .style("fill", "url(#grad)");

    //label for legend
    svg.append("text")
    .attr("x", 50)
    .attr("y", 390)
    .text("Low G3")
    .style("font-size", "10px");

    //label for legend
    svg.append("text")
    .attr("x", 250)
    .attr("y", 390)
    .text("High G3")
    .style("font-size", "10px")
    .attr("text-anchor", "end");


  // visualization #2: scatter plot
  // this scatter plot was chosen to assess the relationship between student's final grades and their weekend alcohol consumption. Study time was also a factor added in with the color of the marks. 
  const scatterWidth = 500, scatterHeight = 300;
  const scatter = svg.append("g")
    .attr("transform", `translate(${marginLeft}, ${pcHeight + 150})`);

    //x scale
  const xScatter = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Walc))
    .range([0, scatterWidth]);
//y scale
  const yScatter = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.G3)])
    .range([scatterHeight, 0]);

    //creating the axes
  scatter.append("g")
    .attr("transform", `translate(0, ${scatterHeight})`)
    .call(d3.axisBottom(xScatter));

  scatter.append("g")
    .call(d3.axisLeft(yScatter));

    //data point, color depends on studytime
  scatter.selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("cx", d => xScatter(d.Walc))
    .attr("cy", d => yScatter(d.G3))
    .attr("r", 4)
    .attr("fill", d => d3.interpolateBlues(d.studytime / 4));

    //x axis label
  scatter.append("text")
    .attr("x", scatterWidth / 2)
    .attr("y", scatterHeight + 40)
    .attr("text-anchor", "middle")
    .text("Weekend Alcohol Consumption");

    //y axis label
  scatter.append("text")
    .attr("x", -scatterHeight / 2)
    .attr("y", -35)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Final Grade ");

    //title
  svg.append("text")
    .attr("x", marginLeft + (scatterWidth / 2))
    .attr("y", pcHeight + 130) 
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text("Final Grade vs. Weekend Alcohol Consumption");

    
    // legend
    const scatterLegend = svg.append("g")
    .attr("transform", `translate(${marginLeft + scatterWidth + 20}, ${pcHeight + 170})`);

    const legendScale = d3.scaleLinear().domain([1, 4]).range([0, 100]);

    const legendAxis = d3.axisRight(legendScale).ticks(4).tickFormat(d3.format("d"));
    //creating color bar
    scatterLegend.selectAll("rect")
    .data(d3.range(1, 4.1, 0.1))
    .enter().append("rect")
    .attr("y", d => legendScale(d))
    .attr("x", 0)
    .attr("width", 10)
    .attr("height", 3)
    .attr("fill", d => d3.interpolateBlues(d / 4));

    scatterLegend.append("g")
    .attr("transform", "translate(12, 0)")
    .call(legendAxis);

    //legend text
    scatterLegend.append("text")
    .attr("x", 0)
    .attr("y", -10)
    .text("Study Time")
    .style("font-size", "10px");


  //visualization #3: bar chart
  // this bar chart aims to compare the average final grades of GP school vs MS school
  const grouped = d3.rollups(data, v => d3.mean(v, d => d.G3), d => d.school);
  const barData = grouped.map(([key, val]) => ({ school: key, avgG3: val }));

  const bar = svg.append("g")
    .attr("transform", `translate(${scatterWidth + 220}, ${pcHeight + 150})`);

    //x scale
  const xBar = d3.scaleBand()
    .domain(barData.map(d => d.school))
    .range([0, 300])
    .padding(0.2);

    //y scale
  const yBar = d3.scaleLinear()
    .domain([0, d3.max(barData, d => d.avgG3)])
    .range([scatterHeight, 0]);

    //axes
  bar.append("g")
    .attr("transform", `translate(0, ${scatterHeight})`)
    .call(d3.axisBottom(xBar));

  bar.append("g")
    .call(d3.axisLeft(yBar));

    //creating bars
  bar.selectAll("rect")
    .data(barData)
    .enter().append("rect")
    .attr("x", d => xBar(d.school))
    .attr("y", d => yBar(d.avgG3))
    .attr("width", xBar.bandwidth())
    .attr("height", d => scatterHeight - yBar(d.avgG3))
    .attr("fill", "#ffa500");

    //x axis label
  bar.append("text")
    .attr("x", 150)
    .attr("y", scatterHeight + 40)
    .attr("text-anchor", "middle")
    .text("School");

    //y axis label
  bar.append("text")
    .attr("x", -scatterHeight / 2)
    .attr("y", -35)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Average Final Grade");
//title
  svg.append("text")
    .attr("x", scatterWidth + 370)
    .attr("y", pcHeight + 130) 
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text("Average Final Grade by School");
  
//legend

    const colorScale = d3.scaleOrdinal()
  .domain(barData.map(d => d.school))
  .range(d3.schemeCategory10);
    //creating color boxes
    bar.selectAll("rect")
    .attr("fill", d => colorScale(d.school));

    const legend = svg.append("g")
    .attr("transform", `translate(${scatterWidth + 500}, ${pcHeight + 170})`);
    //formatting 
    barData.forEach((d, i) => {
    legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", colorScale(d.school));
    legend.append("text")
        .attr("x", 15)
        .attr("y", i * 20 + 9)
        .text(d.school)
        .style("font-size", "10px");
    });


}).catch(console.error);
