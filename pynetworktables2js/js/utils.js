"use strict";
/**
    The functions in this file are still experimental in nature, and as we
    expand the number of functions in this file it is expected that the API
    will change.

    Possible API additions in the future:
    - attach button to boolean
    - attach button to number
    - attach button to boolean (toggle) -- auto update class when clicked
    - attach chooser to list of buttons
      -> needs a list of button ids
*/


// requirements
if (d3 === undefined) {
    alert("d3.js must be downloaded+included to use utils.js!");
}

if ($ === undefined) {
    alert("jQuery must be downloaded+included to use utils.js!");
}



/**
    Given the id of an HTML select element and the key name of a SendableChooser
    object setup in networktables, this will sync the select combo box with the
    contents of the SendableChooser, and you will be able to select an object
    using the select element.

    :param html_id: An ID of an HTML select element
    :param nt_key: The name of the NetworkTables key that the SendableChooser
                   is associated with

    See the WPILib documentation for information on how to use SendableChooser
    in your robot's program.
*/
function attachSelectToSendableChooser(html_id, nt_key) {

    if (!nt_key.startsWith('/')) {
        nt_key = '/SmartDashboard/' + nt_key;
    }

    function update(key, value, isNew) {
        updateSelectWithChooser(html_id, nt_key);
    }

    NetworkTables.addKeyListener(nt_key + '/options', update, true);
    NetworkTables.addKeyListener(nt_key + '/default', update, true);
    NetworkTables.addKeyListener(nt_key + '/selected', update, true);
    
    $(html_id).change(function() {
      NetworkTables.putValue(nt_key + "/selected", $(html_id).val());
    });
}


/**
    This function is designed to be used from the onValueChanged callback
    whenever values from a SendableChooser change, but you probably should
    prefer to use attachSelectToSendableChooser instead.

    See attachSelectToSendableChooser documentation.
*/
function updateSelectWithChooser(html_id, nt_key) {

    var options = NetworkTables.getValue(nt_key + '/options');
    if (options === undefined)
        return; 

    var optDefault = NetworkTables.getValue(nt_key + '/default');
    var selected = NetworkTables.getValue(nt_key + '/selected');

    var opt = d3.select(html_id)
        .selectAll("option")
        .data(options);

    opt.enter()
        .append("option");

    opt.text(function(d,i){
        return options[i];
    });

    opt.exit().remove();

    if (selected !== undefined) {
        $(html_id).val(selected);
    } else if (optDefault !== undefined) {
        $(html_id).val(optDefault);
    }
}

/**
    Creates a circle SVG that turns red when robot is not connected, green when
    it is connected.
    
    :param html_id: ID to insert svg into
    :param size: Size of circle
    :param stroke_width: Border of circle
*/
function attachRobotConnectionIndicator(html_id, size, stroke_width) {
    if (!size)
        size = 20;
        
    size = Math.round(size/2.0)*2;
    
    if (!stroke_width)
        stroke_width = Math.ceil(size/10.0);
    
    var r = Math.round((size - stroke_width*2)/ 2);
    
    var svg = d3.select(html_id).append('svg')
                                .attr('width', size)
                                .attr('height', size);
    var circle = svg.append('circle')
                    .attr('cx', r + stroke_width)
                    .attr('cy', r + stroke_width)
                    .attr('r', r)
                    .style('stroke', 'black')
                    .style('stroke-width', stroke_width);
    
    NetworkTables.addRobotConnectionListener(function(connected) {
        circle.style('fill', connected ? 'lime' : 'red');
    }, true);
}

