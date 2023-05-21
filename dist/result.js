function createPieChart(title, elem, data) {
  const colorArray = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', 
                      '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
                      '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', 
                      '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
                      '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC', 
                      '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
                      '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680', 
                      '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
                      '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3', 
                      '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];
  
  const colors = colorArray.slice(0, data.datasets[0].data.length);

  for (let i = colors.length; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    [colors[i - 1], colors[j]] = [colors[j], colors[i - 1]];
  }

  data.datasets[0].backgroundColor = colors;

  new Chart(elem, {
    type: 'pie',
    data: data,
    options: {
      plugins: {
        title: {
          display: true,
          text: title,
        }
      }
    }
  });
}

function createTableGrid(data, elem) {
  new gridjs.Grid({
    columns: ["#", "Value"],
    search: true,
    data: data,
    pagination: {
      limit: 10,
    },
    style: {
      table: {
        border: '3px solid #ccc',
        maxWidth: '100%',
        boxSizing: 'border-box',
      },
      th: {
        'background-color': 'rgba(0, 0, 0, 0.1)',
        color: '#000',
        'border-bottom': '3px solid #ccc',
        'text-align': 'center'
      },
      td: {
        'text-align': 'center'
      }
    }
  }).render(document.getElementById(elem));
}

function generateResultData(jsonData) {
  const lastAnalysisResults = jsonData.data.attributes.last_analysis_results;

  // Map the analysis results to a 2D array
  const resultsArray = Object.entries(lastAnalysisResults).map(result => [
    result[1].category || '',
    result[1].engine_name || '',
    result[1].engine_version || '',
    result[1].result || '',
    result[1].method || '',
    formatDate(result[1].engine_update) || '' // Format engine_update as a date with slashes
  ]);

  return resultsArray;
}

// Function to format a date string as "YYYY/MM/DD"
function formatDate(dateString) {
  if (dateString.length === 8) {
    return `${dateString.substring(0, 4)}/${dateString.substring(4, 6)}/${dateString.substring(6)}`;
  }
  return dateString; // Return the original value if it doesn't match the expected format
}

function showResult(data, elem) {
  new gridjs.Grid({
    columns: ["category", "engine_name", "engine_version", "result", "method", "engine_update"],
    search: true,
    sort: true,
    pagination: {
      limit: 10
    },
    data: data
  }).render(document.getElementById(elem));
}

function processResult(jsonData) {
  const resultData = generateResultData(jsonData) 
  showResult(resultData, "result-info")
}

function getFileStatus(jsonData) {
  const analysisResults = jsonData.data.attributes.last_analysis_results;
  const totalVotes = jsonData.data.attributes.total_votes;

  // Check if the file is malicious
  const resultsArray = Object.values(analysisResults);
  const isMalicious = resultsArray.some(result => result.category === 'malicious');
  if (isMalicious) {
    return 'The file is dangerous and should not be trusted.';
  }

  // Check if the file is safe
  if (totalVotes.harmless > totalVotes.malicious) {
    return 'The file is safe to use.';
  }

  // Check if the file is suspicious
  const isSuspicious = resultsArray.some(result => result.category === 'suspicious');
  if (isSuspicious) {
    return 'The file is suspicious and should be used with caution.';
  }

  // Check if the file is unknown
  if (totalVotes.harmless === 0 && totalVotes.malicious === 0) {
    return 'The file is unknown and should be used with caution.';
  }

  // If none of the above conditions are met, return a generic message
  return 'The file status is unclear.';
}


function getFileStatusDescription(jsonData) {
  const analysisStats = jsonData.data.attributes.last_analysis_stats;
  const totalVotes = jsonData.data.attributes.total_votes;

  let pros = [];
  let cons = [];

  // Check if the file is malicious
  if (analysisStats.malicious > 0) {
    cons.push('The file has been detected as malicious by some anti-virus engines.');
  } else {
    pros.push('The file has not been detected as malicious by any anti-virus engines.');
  }

  // Check if the file is safe
  if (totalVotes.harmless > totalVotes.malicious) {
    pros.push('The file has been determined to be safe by the majority of users.');
  } else {
    cons.push('The file has been determined to be potentially unsafe by some users.');
  }

  // Check if the file is suspicious
  if (analysisStats.suspicious > 0) {
    cons.push('The file has been detected as suspicious by some anti-virus engines.');
  } else {
    pros.push('The file has not been detected as suspicious by any anti-virus engines.');
  }

  // Check if the file is unknown
  if (totalVotes.harmless === 0 && totalVotes.malicious === 0) {
    cons.push('The file is not well-known and there is no consensus on its safety.');
  }

  let description = '';

  if (pros.length > 0) {
    description += 'Pros: ' + pros.join(', ') + '. ';
  }

  if (cons.length > 0) {
    description += 'Cons: ' + cons.join(', ') + '. ';
  }

  return description;
}

function resultFile(link){
    $.ajax({
      type: "GET",
      url: 'https://yembot-api.vercel.app/analyze',
      data: {
        link: link
      },
      // dataType: "dataType",
      success: function (response) {
          processChart(response)
          processTable(response)
          processResult(response)
          var status = getFileStatus(response)
          var description = getFileStatusDescription(response)
          processMessage(status, description)
          // Assuming you have the totalVotes object from the JSON data
          const totalVotes = response.data.attributes.total_votes;

          // Update the harmless knob value
          const harmlessKnob = document.querySelector('.harmless-knob');
          harmlessKnob.value = totalVotes.harmless;

          // Update the malicious knob value
          const maliciousKnob = document.querySelector('.malicious-knob');
          maliciousKnob.value = totalVotes.malicious;

          Swal.fire({
            icon: 'success',
            title: 'Done Successfully',
            text: `${status}`,
            allowOutsideClick: false,
            footer: '<a href="https://codewithyembot.vercel.app">Hire Me!!!</a>'
          }).then((result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.isConfirmed) {
              Swal.fire({
                title: 'Coffee have finished😞😟',
                html: 'Buy Me coffee😭!!!',
                imageUrl: '/dist/profile.png',
                imageWidth: 400,
                imageHeight: 200,
                allowOutsideClick: false,
                showCancelButton: true,
                confirmButtonText: 'Yes, Sure💖!',
                cancelButtonText: 'Nope Not Today😰',
                reverseButtons: true,
                imageAlt: 'Adekojo Adeyemi',
              }).then((result) => {
                if (result.isConfirmed) {
                  window.open("https://bmc.link/yembot", "_blank");

                }
              })
            }
          })
      },
      error: function(err){
        text_preloader = document.querySelector("#swal2-title");
        text_preloader.textContent = "Internet Issue. reloading..."
        resultFile(link)
      }
      
    });
}

function processChart(jsonData) {
  const stat = jsonData.data.attributes.last_analysis_stats
  const stats = document.getElementById('stats');
  const fileType = document.getElementById('fileType');
  const trid = document.getElementById('trid');

  const lastAnalysisStatsData = {
    labels: [
      'Harmless',
      'Type Unsupported',
      'Suspicious',
      'Confirmed Timeout',
      'Timeout',
      'Failure',
      'Malicious',
      'Undetected'
    ],
    datasets: [{
      data: [
        stat.harmless, // Harmless
        stat['type-unsupported'], // Type Unsupported
        stat.suspicious, // Suspicious
        stat['confirmed-timeout'], // Confirmed Timeout
        stat.timeout, // Timeout
        stat.failure, // Failure
        stat.malicious, // Malicious
        stat.undetected // Undetected
      ],
      backgroundColor: [
        '#43A047',
        '#CDDC39',
        '#FFC107',
        '#E53935',
        '#F44336',
        '#BDBDBD',
        '#F44336',
        '#757575'
      ],
      hoverBackgroundColor: [
        '#4CAF50',
        '#CDDC39',
        '#FFC107',
        '#E53935',
        '#F44336',
        '#9E9E9E',
        '#F44336',
        '#616161'
      ]
    }]
  };
  
  const fileTypeData = {
    labels: Object.keys(jsonData.data.attributes.type_tags),
    datasets: [{
      label: 'File Types',
      data: Object.values(jsonData.data.attributes.type_tags),
      backgroundColor: [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 205, 86)'
      ],
      hoverOffset: 4
    }]
  };
  
  const tridData = {
    labels: jsonData.data.attributes.trid.map(item => item.file_type),
    datasets: [{
      label: 'Trid',
      data: jsonData.data.attributes.trid.map(item => item.probability),
      backgroundColor: [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 205, 86)'
      ],
      hoverOffset: 4
    }]
  };
  
  
  createPieChart("Statistic", stats, lastAnalysisStatsData)
  createPieChart("File Type", fileType, fileTypeData)
  createPieChart("Trid", trid, tridData)
  
}

function processTable(jsonData) {
  // const bundleData = [
  //   ["type", jsonData.data.attributes.bundle_info.type],
  //   ["number of children", jsonData.data.attributes.bundle_info.num_children],
  //   ["uncompressed_size", jsonData.data.attributes.bundle_info.uncompressed_size],
  //   ["highest_datetime", jsonData.data.attributes.bundle_info.highest_datetime],
  //   ["lowest_datetime", jsonData.data.attributes.bundle_info.lowest_datetime]
  // ]

  const infoKeys = Object.keys(jsonData.data.attributes).filter(key => key.endsWith("_info"));
  const bundleData = infoKeys.flatMap(infoKey => {
    const infoObject = jsonData.data.attributes[infoKey];
    return Object.entries(infoObject);
  });

  // Convert Unix timestamps with keys ending in "_date" to human-readable dates
  for (let i = 0; i < bundleData.length; i++) {
    const [key, value] = bundleData[i];
    if (typeof value === "number" && key.endsWith("_date")) {
      bundleData[i][1] = new Date(value * 1000).toLocaleString();
    }
  }

  const detailData = [
    ["first submission date", jsonData.data.attributes.first_submission_date],
    ["last analysis date", jsonData.data.attributes.last_analysis_date],
    ["creation date", jsonData.data.attributes.creation_date],
    ["last modification date", jsonData.data.attributes.last_modification_date],
    ["last submission date", jsonData.data.attributes.last_submission_date],
    ["magic", jsonData.data.attributes.magic],
    ["meaningful name", jsonData.data.attributes.meaningful_name],
    ["reputation", jsonData.data.attributes.reputation],
    ["size", jsonData.data.attributes.size],
    ["times submitted", jsonData.data.attributes.times_submitted],
    ["type description", jsonData.data.attributes.type_description],
    ["type extension", jsonData.data.attributes.type_extension],
    ["type tag", jsonData.data.attributes.type_tag],
    ["unique_sources", jsonData.data.attributes.unique_sources],
    ["ssdeep", jsonData.data.attributes.ssdeep],
    ["tlsh", jsonData.data.attributes.tlsh],
    ["vhash", jsonData.data.attributes.vhash],
    ["md5", jsonData.data.attributes.md5],
    ["sha1", jsonData.data.attributes.sha1],
    ["sha256", jsonData.data.attributes.sha256],
  ]
  
  // Convert Unix timestamps with keys ending in "_date" to human-readable dates
  for (let i = 0; i < detailData.length; i++) {
    const [key, value] = detailData[i];
    if (typeof value === "number" && key.endsWith("date")) {
      detailData[i][1] = new Date(value * 1000).toLocaleString();
    }
  }

  createTableGrid(bundleData, "bundle-info")
  createTableGrid(detailData, "details-info")
}

function processMessage(status, description) {
  const data = [
    ['#', 'Value'],
    ['1', status],
  ];
  
  if (description.includes('Pros:')) {
    const prosIndex = description.indexOf('Pros:');
    const consIndex = description.indexOf('Cons:');
    
    if (prosIndex === 0) {
      data.push(['2', '']);
      data.push(['3', 'Pros:']);
      const pros = description.slice(prosIndex, consIndex !== -1 ? consIndex : undefined);
      const prosList = pros.replace('Pros:', '').trim().split(', ');
      prosList.forEach((pro, index) => {
        data.push([`${index + 4}.`, pro]);
      });
    }
    
    if (consIndex !== -1) {
      data.push(['', '']);
      data.push(['', 'Cons:']);
      const cons = description.slice(consIndex);
      const consList = cons.replace('Cons:', '').trim().split(', ');
      consList.forEach((con, index) => {
        data.push([`${index + 8}.`, con]);
      });
    }
  } else {
    data.push(['2', description]);
  }

  createTableGrid(data, "analyse-info");
}

Swal.fire({
  title: 'Analzing!',
  html: 'Please relax while I get some coffee!!!',
  timerProgressBar: true,
  allowOutsideClick: false,
  didOpen: () => {
    Swal.showLoading()
  }
})
let link = localStorage.getItem('analyze')

resultFile(link)