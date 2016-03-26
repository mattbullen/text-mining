// Matthew Bullen
// E-mail: mattbullenprogramming@gmail.com
// Cell: 212-882-1391

// Since I'm not using Angular or any particular data modelling library, for demo purposes,
// the window object is a convenient place to store data about the reviews.
window.reviews = JSON.parse(decodeURIComponent(raw));

$(document).ready(function initialize() {
    parseReviews();
});

// Main sequence.
function parseReviews() {

    // To reduce loading time and to avoid burdening the Yelp.com servers, the reviews are loaded 
    // from the rawData.js file. The getReviews() function was how I first scraped them.
    // getReviews();
    aggregateReviews();
    getConcepts();
    parseConcepts();
    
    // A quick form of Angular-esque dirty checking to ensure that the data is ready to use before rendering the graph.
    var sentimentsCheck = window.setInterval(function() {
        if (window.reviews.parsedConcepts && window.reviews.parsedConcepts[0] && window.reviews.parsedConcepts[0].support) {
            getSentiments();
            clearInterval(sentimentsCheck);
        }
    }, 50);
    
    var renderCheck = window.setInterval(function() {
        if (window.reviews.parsedConcepts && 
            window.reviews.parsedConcepts[0] && window.reviews.parsedConcepts[0].polarity &&
            window.reviews.parsedConcepts[1] && window.reviews.parsedConcepts[1].polarity &&
            window.reviews.parsedConcepts[2] && window.reviews.parsedConcepts[2].polarity &&
            window.reviews.parsedConcepts[3] && window.reviews.parsedConcepts[3].polarity &&
            window.reviews.parsedConcepts[4] && window.reviews.parsedConcepts[4].polarity) {
                renderSVG();
                clearInterval(renderCheck);
        }
    }, 50);
}

// Main routine to render the graph.
function renderSVG() {

    // Get the base configuration variables.
    var graphConfig = getConfiguration();
    
    // Find the layout dimensions for the base canvas for later reference.
    var margin = graphConfig.margin; 
    var width = +graphConfig.graphWidth - +margin.left - +margin.right;
    var height = +graphConfig.graphHeight - +margin.top - +margin.bottom;
        
    // Define the min/max canvas ranges for x and y values.
    var x = d3.scale.linear().range([0, width]).domain([0, 6]);
    var y = d3.scale.linear().range([height, 0]).domain([-1.25, 1.25]);
        
    // Define the y-axis dimensions, ticks, and orientation.
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(graphConfig.yAxisTicks)
        .tickFormat(function(d) {
            if (d === -1.0) { return "Negative"; }
            if (d === 0) { return "Neutral"; }
            if (d === 1.0) { return "Positive"; }
            return "";
        });
        
    // Append the base canvas for the graph.
    $("#loading").hide();
    var graphContainer = document.getElementById(graphConfig.graphID);
    var svg = d3.select(graphContainer).append("svg")
        .attr({
            "id": "graph-svg",
            "width": width + margin.left + margin.right,
            "height": height + margin.top + margin.bottom
        })
        .append("g")
        .attr({
            "transform": "translate(" + margin.left + "," + margin.top + ")"
        });
    
    // Append the top border line.
    svg.append("line")
        .attr({
            "x1": 0,
            "y1": 0,
            "x2": width,
            "y2": 0
        })
        .style({
            "stroke": "#000",
            "stroke-width": "1.0",
            "shape-rendering": "crispEdges"
        });
        
    // Append the middle divisor line.
    svg.append("line")
        .attr({
            "x1": 0,
            "y1": height / 2,
            "x2": width,
            "y2": height / 2
        })
        .style({
            "stroke": "#000",
            "stroke-width": "1.0",
            "opacity": "0.33333",
            "shape-rendering": "crispEdges"
        });
        
    // Append the bottom border line.
    svg.append("line")
        .attr({
            "x1": 0,
            "y1": height,
            "x2": width,
            "y2": height
        })
        .style({
            "stroke": "#000",
            "stroke-width": "1.0",
            "shape-rendering": "crispEdges"
        });
        
    // Append the right border line.
    svg.append("line")
        .attr({
            "x1": width - 1,
            "y1": 0,
            "x2": width - 1,
            "y2": height
        })
        .style({
            "stroke": "#000",
            "stroke-width": "1.0",
            "shape-rendering": "crispEdges"
        }); 
    
    // Append the y-axis.
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
        
    // Append a <div> to act as the container for the tooltip.
    if (!document.getElementById("tooltipContainer")) {
        var tooltipDiv = d3.select("#" + graphConfig.graphID)
            .append("div")
            .attr({
                "id": "tooltipContainer"
            })
            .style({
                "z-index": "9999",
                "position": "absolute",
                "-webkit-font-smoothing": "subpixel-antialiased !important",
                "opacity": "0"
            });
    }
    
    // Get the highest support score across all concepts.
    var baseSupport = +window.reviews.parsedConcepts[0].support;
    
    // Append text to the SVG canvas.
    var conceptNodes = svg.selectAll("g.conceptNodes")
        .data(window.reviews.parsedConcepts)
        .enter()
        .append("g")
        .classed("conceptNodes", true);
  
    conceptNodes.append("text")
        .text(function(d) { return d.name; })
        .attr({
            "x": function(d, i) { return x(i + 1); },
            "y": function(d) {
                if (d.polarity === "negative") {
                    var yValue = 0 - +d.polarity_confidence;
                } else if (d.polarity === "neutral") {
                    var yValue = 0;
                } else {
                    var yValue = +d.polarity_confidence;
                }
                return y(yValue);
            },
            "dominant-baseline": "middle",
            "text-anchor": "middle",
            "data-name": function(d) { return d.name; },
            "data-url": function(d) { return d.url; },
            "data-support": function(d) { return d.support; },
            "data-polarity": function(d) { return d.polarity; },
            "data-polarity-confidence": function(d) { return d.polarity_confidence; }
        })
        .style({
            "font-family": "Montserrat, Arial, sans-serif !important",
            "font-weight": "700",
            "fill": function(d) {
                if (d.polarity === "negative") {
                    return "#c10c06";
                } else if (d.polarity === "neutral") {
                    return "#157d41";
                } else {
                    return "#191970";
                }
            },
            "opacity": function(d) {
                return d.polarity_confidence;
            },
            "cursor": "pointer",
            "font-size": function(d) { 
                var item = d3.select(this);
                return (16+ (+item.attr("data-support") / baseSupport) * 40) + "px";
            }
        })
        .on("click", function(d) {
            
            var item = d3.select(this);
            
            var tooltip = d3.select("#tooltipContainer");
            var supportPercent = "" + ((+item.attr("data-support") / baseSupport) * 100)
            var polarityPercent = "" + (+item.attr("data-polarity-confidence") * 100)
            var tooltipContent = '<div class="tooltipLine"><p class="tooltipEntry bold">Concept</p><p class="tooltipEntry">' + item.attr("data-name") + '</p></div>'
                + '<br><div class="tooltipLine"><p class="tooltipEntry bold">Relative Confidence</p><p class="tooltipEntry">' + supportPercent.substring(0, 4) + '%</p></div>'
                + '<br><div class="tooltipLine"><p class="tooltipEntry bold">Polarity</p><p class="tooltipEntry">' + item.attr("data-polarity") + '</p></div>'
                + '<br><div class="tooltipLine"><p class="tooltipEntry bold">Polarity Confidence</p><p class="tooltipEntry">' + polarityPercent.substring(0, 4) + '%</p></div>'
                + '<br><div class="tooltipLine"><p class="tooltipEntry bold">Concept URL</p><p class="tooltipEntry"><a href="' + item.attr("data-url") + '">' + item.attr("data-url") + '</a></p></div>';

            // Set the tooltip's location on the canvas
            var pageXValue = +item.attr("x");
            var pageYValue = +item.attr("y");
            var xOffset = Math.round(pageXValue + graphConfig.tooltipXOffset);
            var yOffset = Math.round(pageYValue + graphConfig.tooltipYOffset);

            tooltip
                .html(tooltipContent)
                .style({
                   "left": xOffset + "px",
                   "top": yOffset + "px",
                   "border": "1px solid #333",
                   "padding": "15px 15px 5px 15px",
                   "font-size": "12px"
                });
            
            tooltip.transition().duration(200).style({ "opacity": 1.0 });
        });
        
    // Hides the tooltip on click.
    d3.select("#tooltipContainer").on("click", function(d) {
        var item = d3.select(this);
        item.transition().duration(0).style({ "opacity": 0 });
        item.html("");
    });
}
    
// SVG base configuration variables.
function getConfiguration() {
    return {
        graphID: "svg",
        graphWidth: 960,
        graphHeight: 280,
        yAxisTicks: 3,
        yAxisLabelPadding: -36,
        margin: {
            top: 0, 
            right: 0, 
            bottom: 5, 
            left: 80
        },
        tooltipXOffset: 560,
        tooltipYOffset: 320
    };
}
    
// Assembles the reviews for the getSentiment() POST request.
function getSentiments() {
    var originalReviews = window.reviews.original;
    var parsedConcepts = window.reviews.parsedConcepts;
    var key, concept, regex, match;
    for (key in parsedConcepts) {
        concept = parsedConcepts[key].name;
        regex = new RegExp(concept, "gi");
        var matches = originalReviews.filter(function(o) {
            return o.match(regex);
        });
        window.reviews.sentimentsIndividual[concept] = matches;
        var aggregateText = "";
        for (match in matches) {
            aggregateText += matches[match] + "+";
        }
        getSentiment(aggregateText, concept);
    }
}

// Gets the sentiment polarity for all reviews associated with a particular concept.
function getSentiment(aggregateText, concept) {
    $.ajax({
        type: "POST",
        url: "https://cors-anywhere.herokuapp.com/api.aylien.com/api/v1/sentiment",
        headers: {
            "X-AYLIEN-TextAPI-Application-Key": "ac06ab5a00f16a5aa7f1432d5d6e559d",
            "X-AYLIEN-TextAPI-Application-ID": "3a4ba29e"
        },
        data: formatTextForPOST(aggregateText),
        success: function(response) {
            console.log("\ngetSentiment() response:", response);
            if (response.polarity && response.subjectivity) {
                var index = window.reviews.parsedConcepts.findIndex(function(o) { return o.name === concept; });
                window.reviews.parsedConcepts[index] = Object.assign(window.reviews.parsedConcepts[index], response);
                response.concept = concept;
                window.reviews.sentimentsAggregate.push(response);
            }
        },
        error: function(error) {
            console.log("\ngetSentiment() error:", error);
        }
    });
}

// Stores the extracted concepts in the "reviews" window storage object.
function parseConcepts() {
    var data = window.reviews.concepts.sort(function (a, b) {
        if (a.support > b.support) { return -1; }
        if (a.support < b.support) { return 1; }
        return 0;
    });
    data = data.slice(0, 5);
    var storage = window.reviews.parsedConcepts;
    var key, concept;
    for (key in data) {
        concept = data[key];
        storage.push({
            "url": concept.url,
            "name": concept.surfaceForms[0].string,
            "support": concept.support
        });
    }
}

// Finds the extractable concepts in the reviews.
function getConcepts() {
    $.ajax({
        type: "POST",
        url: "https://cors-anywhere.herokuapp.com/api.aylien.com/api/v1/concepts",
        headers: {
            "X-AYLIEN-TextAPI-Application-Key": "ac06ab5a00f16a5aa7f1432d5d6e559d",
            "X-AYLIEN-TextAPI-Application-ID": "3a4ba29e"
        },
        data: formatTextForPOST(window.reviews.originalConcat).substring(0, 542800),
        success: function(response) {
            console.log("\ngetConcepts() response:", response);
            if (response.concepts) {
                var key;
                for (key in response.concepts) {
                    response.concepts[key].url = key;
                    window.reviews.concepts.push(response.concepts[key]);
                }
                parseConcepts();
            }
        },
        error: function(error) {
            console.log("\ngetConcepts() error:", error);
        }
    });
}

// Aggregates all reviews into a string.    
function aggregateReviews() {
    window.reviews.originalConcat = "";
    var review;
    for (review in window.reviews.original) {
        window.reviews.originalConcat += window.reviews.original[review] + "+";
    }
}

// Retrieves a batch of 20 reviews and stores them in the "reviews" window storage object.
function getReviewBatch(j) { 
    $.get("http://cors-anywhere.herokuapp.com/www.yelp.com/biz/bottega-louie-los-angeles?start=" + j, function(response) {
        var pTags = response.match(/<p itemprop="description" lang="en">(.*)<\/p>/gi);     
        // console.log("Retrieved <p> reviews:", pTags);
        var iLength = pTags.length;
        var i, p;
        for (i = 0; i < iLength; i++) {
            p = pTags[i].replace('<p itemprop="description" lang="en">', "").replace('</p>', "").replace(/<br\s*[\/]?>/gi, "").replace(/&#39;/gi, "'").replace(/&#34;/gi, "'");
            window.reviews.original.push(p);
            window.reviews.originalConcat += " " + p;
        }
    });
}

// A simple loop to scrape reviews by page. Yelp displayed 20 reviews per page.
function getReviews() {
    var j;
    for (j = 0; j < 5000; j = j + 20) {
        getReviewBatch(j);
    }
    parseReviews();
}

// I used this to download the original batch of 5,000 reviews.
function downloadReviewsJSON() {
    var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.reviews));
    var a = document.createElement('a');
    a.href = "data:" + data;
    a.download = "data.json";
    var container = document.getElementById("content");
    container.appendChild(a);
    a.click();
}

// Removes special characters from the string used in the POST request.
// The API I used is very particular about which characters it will accept.
function formatTextForPOST(text) {
    return "text=" + text.replace(/&#39;/gi, "'").replace(/&#34;/gi, "'").replace(/%/gi, " percent").replace("amp;", " and ").replace(/\\/gi, "").replace(/\//gi, "").replace(/\=\"/gi, "").replace(/\=/gi, "+").replace(/\#/gi, "").replace(/\"/gi, "").replace(/\…/gi, "").replace(/â/gi, "a").replace(/ç/gi, "c").replace(/è/gi, "e").replace(/é/gi, "e").replace(/ê/gi, "e").replace(/ë/gi, "e").replace(/î/gi, "i").replace(/û/gi, "u").replace("朝６時半からオープンしているので、朝食を食べに行くことが多いボッテガルイ。値段は少し高めだけれど、サービスも良く、店内も綺麗で、居心地がいい。おすすめは焼き立てのピザ。スイーツのお店でもあるので、最後のデザートも忘れずに頼んでみてね！", "").replace(/\，/gi, "+").replace(/\ù/gi, "u").replace("Lady Gaga", "Vivaldi").replace("vibrator", "").replace("sex", "").replace(/\s/g, "+");
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.findIndex called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };
}
