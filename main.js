// Width and height
var w = 760;
var h = 600;

// Minimum and maximum for color gradient
var minimum = 0;
var max_confirmed = 0;
var max_deaths = 0;


pointTwo = 50;
pointThree = 100;
pointFour = 500;
pointFive = 1000;

// color gradients going from min to max (left to right)

const color_gradient = ["#1abdbb", "#18dbab", "#f4d889", "#f7876b", "#db1848"]
var grey = "#C9C9C9";
var color;

var current_date;
formatDate = d3.time.format("%b %d");

// parameters
var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
  },
  s_width = 960 - margin.left - margin.right,
  s_height = 300 - margin.bottom - margin.top;

// Returns max value by property of json array
function getMax(arr, prop) {
    var max;
    for (var i=0 ; i<arr.length ; i++) {
        if (max == null || parseInt(arr[i][prop]) > parseInt(max[prop]))
            max = arr[i];
    }
    return max;
}

// Define map projection
var projection = d3.geo.mercator()
                       .center([ -120, 37 ])
                       .translate([ w/2, h/2 ])
                       .scale([ w*3.3 ]);

// Define path generator
var path = d3.geo.path()
                 .projection(projection);

// Create SVG
var svg = d3.select("#container")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

// Load population JSON data
var pop_json;
d3.json("county_populations.json", function(json) {
    pop_json = json.data;
});

var hospital_json;
d3.json("flask/hospitalCTY.json", function(json) {
    hospital_json = json.data;
});

// Display numbers with commas
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var xTooltipPosition;
var yTooltipPosition;
$("body").mousemove(function(e) {
  xTooltipPosition = e.pageX/window.innerWidth * 100;
  yTooltipPosition = e.pageY/window.innerHeight * 100;

  d3.select("#tooltip")
      .style("left", xTooltipPosition + "%")
      .style("top", yTooltipPosition + "%");
})


// Load New York Times COVID-19 Data
var covid_counties;
var min_date;
var max_date;
var start_date;
var timeScale, brush, s_svg, slider, handle;
var plot;
$(document).ready(function() {
  $.ajax({
        url: "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv",
        async: false,
        success: function (csvd) {
            // reverse data so freshest data is first
             var items = $.csv.toObjects(csvd).reverse();

             // filter california counties
             covid_counties = items.filter(function (i,n){
                 return i.state == "California";
            });

            // get max confirmed cases
            max_confirmed = getMax(covid_counties, "cases").cases;

            // get max num deaths
            max_deaths = getMax(covid_counties, "deaths").deaths;

            color = d3.scale.linear().domain([minimum, pointTwo, pointThree, pointFour, max_confirmed]).range(color_gradient);

            // get first and last date
            max_date = new Date(covid_counties[0].date + " 00:00");
            min_date = new Date(covid_counties[covid_counties.length-1].date + " 00:00");
            start_date = new Date(covid_counties[0].date + " 00:00");
            current_date = start_date;

            // time bounds
            timeScale = d3.time.scale()
              .domain([min_date, max_date])
              .range([0, s_width])
              .clamp(true);

              // defines brush
              brush = d3.svg.brush()
                .x(timeScale)
                .extent([start_date, start_date])
                .on("brush", brushed);

              s_svg = d3.select("body").append("svg")
                 .attr("width", s_width + margin.left + margin.right)
                 .attr("height", s_height/2 + margin.top + margin.bottom)
                 .append("g")
                 // classic transform to position g
                 .attr("transform", "translate(" + margin.left + "," + -1 * margin.top + ")");

              s_svg.append("g")
                     .attr("class", "x axis")
                  // put in middle of screen
                  .attr("transform", "translate(0," + s_height / 2 + ")")
                  // inroduce axis
                  .call(d3.svg.axis()
                     .scale(timeScale)
                     .orient("bottom")
                     .tickFormat(function(d) {
                        return formatDate(d);
                     })
                     .tickSize(5)
                     .tickPadding(12)
                     .tickValues([timeScale.domain()[0], timeScale.domain()[1]]))
                     .select(".domain")
                     .select(function() {
                        console.log(this);
                        return this.parentNode.appendChild(this.cloneNode(true));
                     })
                     .attr("class", "halo");

               slider = s_svg.append("g")
                 .attr("class", "slider")
                 .call(brush);

              slider.selectAll(".extent,.resize")
                 .remove();

              slider.select(".background")
                 .attr("height", s_height);

              handle = slider.append("g")
                 .attr("class", "handle")

              handle.append("path")
                 .attr("transform", "translate(0," + s_height / 2 + ")")
                 .attr("d", "M 0 -20 V 20")

              handle.append('text')
                 .text(start_date)
                 .attr("transform", "translate(" + (-18) + " ," + (s_height / 2 - 25) + ")");

              slider.call(brush.event);

              // Load in GeoJSON data
              d3.json("cb_2014_us_county_5m.json", function(json) {

                  // Bind data and create one path per GeoJSON feature
                  plot = svg.selectAll("path")
                      .data(json.features)
                      .enter()
                      .append("path")
                      .attr("d", path)
                      .style("fill", function(d) {
                          return getColor(d.properties.GEOID, current_date);
                      })
                      .on("mouseover", function(d){
                          d3.select("#date")
                                .text(current_date.toDateString())
                          d3.select("#county")
                              .text(d.properties.NAME);
                          d3.select("#geoid")
                              .text(d.properties.GEOID);
                          d3.select("#population")
                                .text(numberWithCommas(getPopulation(d.properties.NAME)))
                          getCovidData(d.properties.GEOID, current_date);
                          getNumberBeds(d.properties.NAME);
                          d3.select("#tooltip")
                              .classed("hidden", false);
                      })
                      .on("mouseout", function(){
                          d3.select("#tooltip").classed("hidden", true);
                      });

              });
        },
  });
});

// Displays number of confirmed cases and deaths given geo id
function getCovidData(geoid, current_date)
{
      // filter so geoid matches
      var filtered = covid_counties.filter(function (i,n){
          return i.fips == geoid && new Date(i.date + " 00:00").getMonth() == current_date.getMonth() && new Date(i.date + " 00:00").getDate() == current_date.getDate();
     });

     // check if in list
     if (filtered.length > 0)
     {
         d3.select("#confirmed").text(filtered[0].cases);
         d3.select('#deaths').text(filtered[0].deaths);

         if (filtered.length > 1){
             d3.select("#delta_confirmed").text("(+" + (parseInt(filtered[0].cases)-parseInt(filtered[1].cases)) + ")");
         }
     }
     else
     {
         d3.select("#confirmed").text("No data.");
         d3.select('#deaths').text("No data.");
     }
}

function getColor(geoid, current_date)
{
    // filter so geoid matches
    var filtered = covid_counties.filter(function (i,n){
        return i.fips == geoid && new Date(i.date + " 00:00").getMonth() == current_date.getMonth() && new Date(i.date + " 00:00").getDate() == current_date.getDate();
  });

  // check if in list
  if (filtered.length > 0)
  {
      return color(parseInt(filtered[0].cases));
  }

  return grey;
}

// Returns number of staffed hospital beds given geo id
function getNumberBeds(county) {

    var result = hospital_json.filter(function (i, n) {
        return i.CTYNAME == county;
    });

    // check if in list
    if (result.length > 0)
    {
        d3.select("#beds").text(result[0].staffedBeds);
    }
    else
    {
        d3.select("#beds").text("No data.");
    }


    return "0";
};

// Returns population given county name
function getPopulation(county)
{
    var result = pop_json.filter(function (i, n) {
         return i.CTYNAME == county;
    })[0].Pop;

    return result;
};

function brushed() {
  current_date = brush.extent()[0];

  if (d3.event.sourceEvent) { // not a programmatic event
    current_date = timeScale.invert(d3.mouse(this)[0]);
    brush.extent([current_date, current_date]);
  }

  handle.attr("transform", "translate(" + timeScale(current_date) + ",0)");
  handle.select('text').text(formatDate(current_date));

  updateColors();
}

function updateColors()
{
    svg.selectAll("path")
        .attr("d", path)
        .style("fill", function(d) {
            return getColor(d.properties.GEOID, current_date);
        });
}

