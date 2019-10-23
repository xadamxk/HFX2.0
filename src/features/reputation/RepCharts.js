const HFX = require("../../HFX");

class RepCharts extends HFX.Feature {
  constructor() {
    super({
      section: HFX.Section.Reputation,
      name: "Rep Charts",
      default: true,
      description: "Reputation details in a nice chart.",
      id: "repcharts"
    });
  }

  run() {
    const isRepsGiven = window.location.pathname.startsWith("/repsgiven.php");
    const isReps = window.location.pathname.startsWith("/reputation.php");
    const username = $("span.largetext strong").text();
    const colors = {
      positive: "#32CD32",
      neutral: "#666666",
      negative: "#CC3333"
    };

    // Add button to easily switch between reputation and reputation given
    $("a.button.rate_user_button").parent().before(`
      <div class="float_left" style="padding-bottom: 4px;">
        <a class="rep-switch button rate_user_button" href="${isReps ? window.location.href.replace("reputation.php", "repsgiven.php") : window.location.href.replace("repsgiven.php", "reputation.php")}">
          <span>${isReps ? "Reps Given" : "Reps Received"}</span>
        </a>
      </div>
    `);

    const periods = ["week", "month", "sixMonths", "allTime"];
    const sentiments = ["positive", "neutral", "negative"];
    const rep = {};

    // Initialize reputation object
    sentiments.forEach((sentiment) => {
      periods.forEach((period) => {
        rep[sentiment] = {};
        rep[sentiment][period] = null;
      });
    });

    // Parse values from the reputation table on right-side
    const repMatrix = $("span.smalltext:contains(Last 6 months)").closest("table").first()
      .text().match(/(\d+)\s*(\d+)\s*(\d+)/g)
      .map((row) => row.split("\n").map((col) => parseInt(col.trim())));

    // The reputations given page does not have an "All Time" row on the right-side reputation table
    // Get the "All Time" from the details underneath username
    if (isRepsGiven) {
      const allTimeContainer = $("span.smalltext:contains(Total Given)");

      sentiments.forEach((sentiment) => {
        rep[sentiment]["allTime"] = parseInt(allTimeContainer.find(`strong.reputation_${sentiment}`).next().text());
      });
    }

    // Transfer reputation from the matrix to the object for easier access
    repMatrix.forEach((value, row) => {
      value.forEach((value, col) => {
        rep[sentiments[col]][periods[row]] = value;
      });
    });

    // Exit if there is no reputation to show
    if (rep.positive.allTime === 0 && rep.neutral.allTime === 0 && rep.negative.allTime === 0) {
      return;
    }

    // Start dynamic listeners
    this.startDynamicListeners();

    // Create canvases
    const canvasPieChart = $("<canvas>").addClass("rep-chart").css("vertical-align", "middle");
    const canvasBarChart = $("<canvas>").addClass("rep-chart").css("vertical-align", "middle");

    // Set width to adjust relative chart sizes
    canvasPieChart.attr("width", "120");
    canvasBarChart.attr("width", "300");

    // Clone reputation section
    const section = $("span.largetext strong").closest("table").closest("tr");
    const header = section.prev();
    const newSection = section.clone();
    const newHeader = header.clone();

    // Reconfigure cloned section
    newHeader.find("strong").html("HFX Reputation Chart");
    newSection.find("table tr").html("<td></td><td></td>");

    // Add canvases
    newSection.find("table td").eq(0).append(canvasPieChart);
    newSection.find("table td").eq(1).append(canvasBarChart);

    // Inject cloned section
    section.after(newHeader);
    newHeader.after(newSection);

    canvasPieChart.data("rep-chart", new Chart(canvasPieChart, {
      type: "pie",
      data: {
        labels: ["Positives", "Neutrals", "Negatives"],
        datasets: [{
          backgroundColor: [colors.positive, colors.neutral, colors.negative],
          data: [rep.positive.allTime, rep.neutral.allTime, rep.negative.allTime]
        }]
      },
      options: {
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              const dataset = data.datasets[tooltipItem.datasetIndex];
              const currentValue = dataset.data[tooltipItem.index];
              const total = dataset.data.reduce((previousValue, currentValue) => {
                return previousValue + currentValue;
              });

              return `${((currentValue / total) * 100).toFixed(1)}% ${data.labels[tooltipItem.index]}`;
            }
          }
        },
        cutoutPercentage: 50,
        animateRotate: true,
        hover: {
          animationDuration: 750
        },
        title: {
          display: true,
          fontColor: "#cccccc",
          text: `${username}'s ${isRepsGiven ? "Reputation Given" : "Reputation"} Summary`,
          fontSize: 18
        },
        legend: {
          display: true,
          fullWidth: true,
          position: "top",
          labels: {
            fontColor: "white",
            boxWidth: 20,
            fontSize: 12
          }
        }
      }
    }));

    canvasBarChart.data("rep-chart", new Chart(canvasBarChart, {
      type: "horizontalBar",
      data: {
        labels: ["Week", "Month", "6 Months"],
        datasets: [{
          backgroundColor: colors.positive,
          data: [rep.positive.week, rep.positive.month, rep.positive.sixMonths],
          label: "Positives"
        }, {
          backgroundColor: colors.neutral,
          data: [rep.neutral.week, rep.neutral.month, rep.neutral.sixMonths],
          label: "Neutrals"
        }, {
          backgroundColor: colors.negative,
          data: [rep.negative.week, rep.negative.month, rep.negative.sixMonths],
          label: "Negatives"
        }]
      },
      options: {
        title: {
          display: true,
          fontColor: "#cccccc",
          text: "Timeline"
        },
        tooltips: {
          enabled: true
        },
        hover: {
          animationDuration: 100
        },
        scales: {
          xAxes: [{
            ticks: {
              display: true,
              beginAtZero: true,
              fontFamily: "'Open Sans Bold', sans-serif",
              fontSize: 12
            },
            scaleLabel: {
              display: true
            },
            stacked: true
          }],
          yAxes: [{
            ticks: {
              display: true,
              fontFamily: "'Open Sans Bold', sans-serif",
              fontSize: 12
            },
            stacked: true
          }]
        },
        legend: {
          display: true,
          fullWidth: true,
          labels: {
            fontColor: "white",
            boxWidth: 20,
            fontSize: 12
          }
        }
      }
    }));
  }

  startDynamicListeners() {
    $("body").on("click", "canvas.rep-chart", function(e) {
      const repChart = $(this).data("rep-chart");
      const activePoint = repChart.getElementsAtEventForMode(e, "nearest", {intersect: true}).pop();

      if (activePoint !== undefined) {
        const location = window.location.href.replace(/&show=[a-zA-Z]*/, "");
        const label = (repChart.config.type === "pie")
          ? repChart.data.labels[activePoint._index]
          : repChart.data.datasets[activePoint._datasetIndex].label;

        switch (label) {
          case "Positives":
            window.location.href = location + "&show=positive";
            break;
          case "Neutrals":
            window.location.href = location + "&show=neutral";
            break;
          case "Negatives":
            window.location.href = location + "&show=negative";
            break;
        }
      }
    });
  }
};

HFX.Feature.RepCharts = new RepCharts();

module.exports = HFX;
