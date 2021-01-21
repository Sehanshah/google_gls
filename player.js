let GLS_SOURCE_URL = 'https://guidedlearning.oracle.com/player/latest/api/scenario/get/v_IlPvRLRWObwLnV5sTOaw/5szm2kaj/?callback=__5szm2kaj&refresh=true&env=dev&type=startPanel&vars%5Btype%5D=startPanel&sid=none&_=1582203987867'
let JQUERY_URL = 'https://code.jquery.com/jquery-3.5.1.js'
let TOOL_TIP_CSS_URL = 'https://guidedlearning.oracle.com/player/latest/static/css/stTip.css'
let SOURCE_DATA = {}
let LAST_STEP_ID = 'eol0'
let STEP_COUNTER = 0
let STEPS = []

function load_js(url, type = '') {
	var script = document.createElement('script')
	script.type = "text/javascript"
	script.src = url
	if (type == 'jquery') {
		// Main function starts once the jquery is loaded
		script.addEventListener("load", start_main_function, false)
	}
	document.head.appendChild(script)
}

function load_css(url, css_styles = '') {
	if (css_styles != '') {
		$('head').append(`<style> ${css_styles} </style>`) // Load css as string
		return
	}
	var link = document.createElement('link')
	link.rel = 'stylesheet'
	link.type = 'text/css'
	link.href = url
	document.getElementsByTagName('head').item(0).appendChild(link)
}

function get_source_data() {
	$.ajax({
		url: GLS_SOURCE_URL,
		jsonp: "callback",
		dataType: "jsonp",
		success: function (response) {
			SOURCE_DATA = response.data
			load_css(url = '', css_styles = SOURCE_DATA["css"]) // css from response data is loaded
			STEPS = SOURCE_DATA["structure"]["steps"]
			show_step(STEPS[0]["id"]) // Always considering first element in steps would be the first step
		},
		error: function (err) {
			console.log("-- Error -- ", err)
		},
	});
}


function get_wrapped_ttip(content, element_id) {
	// Wrapping the constructed tooltip with wrapper as in the document
	return `
        <div class = "sttip" id='${element_id}'>
        <div class = "tooltip in" >
        <div class = "tooltip-arrow"> </div>
        <div class = "tooltip-arrow second-arrow"> </div>
        <div class = "popover-inner"> ${ content } </div>
        </div>
        </div>`
}


function construct_html_str(json_data, step_count, steps_count) {
	// Constructing tooltip html div
	let type = json_data["action"]["type"]
	var container_html = SOURCE_DATA["tiplates"][type]
	if (container_html) {
		var container_html_obj = $(container_html)
		container_html_obj.find(`[data-iridize-id='content']`).append(json_data["action"]["contents"]["#content"])
		container_html_obj.find(`[data-iridize-role='stepCount']`).append(step_count)
		container_html_obj.find(`[data-iridize-role='stepsCount']`).append(steps_count)
		container_html_obj.find(`[data-iridize-role='closeBt']`).attr("onclick", `javascript:$(this).parents('.sttip').hide();`)
		return $(container_html_obj).html()
	}
}


function get_step_by_id(step_id) {
	// Iterating the STEPS(array of dict) from data to find the step json data
	for (var i = 0; i < STEPS.length; i++) {
		if (STEPS[i]["id"] == step_id) {
			return STEPS[i];
		}
	}
}

function get_next_step(step_json) {
	// step data has followers, so the next step may not be based on the index of STEPS
	if (step_json["followers"].length) {
		return get_step_by_id(step_json["followers"][0]["next"])
	}
	return false
}


function show_previous_step(step_div_id, current_step_div_id) {
	$("#" + step_div_id).show();
	$("#" + current_step_div_id).hide();
}

function show_step(step_id, prev_step_div_id = '') {
	if (prev_step_div_id) {
		// while proceeding next step the current step element is made hidden
		$("#" + prev_step_div_id).hide();
	}
	if (step_id == LAST_STEP_ID) {
		// On last step
		return
	}
	var step_json = get_step_by_id(step_id)

	if ($('#' + step_json["uid"]).length) {
		// If the step div is already created, we are displaying that element and return
		$("#" + step_json["uid"]).show()
		return
	}
	STEP_COUNTER += 1
	var tooltip_html_str = get_wrapped_ttip(content = construct_html_str(step_json, STEP_COUNTER, STEPS.length - 1), element_id = step_json["uid"])
	var step_selector = step_json["action"]["selector"]

	var next_step = get_next_step(step_json)
	if (!next_step) {
		// On last step
		return
	}
	var tooltip_html_obj = $(tooltip_html_str)
	if (next_step["id"] == LAST_STEP_ID) {
		// for last step changed Next label to Close
		tooltip_html_obj.find(`[data-iridize-role='nextBt']`).last().html("Close")
	}
	tooltip_html_obj.find(`[data-iridize-role='nextBt']`).last().attr("href", `javascript:show_step( '${next_step["id"]}', '${step_json["uid"]}' )`)


	if (prev_step_div_id) {
		tooltip_html_obj.find(`[data-iridize-role='prevBt']`).last().attr("onclick", `javascript:show_previous_step( '${prev_step_div_id}',  '${step_json["uid"]}')`)
		tooltip_html_obj.find(`[data-iridize-role='prevBt']`).last().css({
			"display": "block"
		})
	}

	var placement = step_json["action"]["placement"]
	var pos = $(step_selector).last().offset()
	if (placement == 'right') {
		pos["left"] = pos["left"] + $(step_selector).last().width()
	}
	if (placement == 'bottom') {
		pos["top"] = pos["top"] + $(step_selector).last().height()
    }
    
	$("body").append($(tooltip_html_obj)[0].outerHTML) // Appending the tooltip to the body
	$('#' + element_id).offset(pos) // setting position of element
}

function start_main_function() {
	load_css(TOOL_TIP_CSS_URL)
	get_source_data()
}

load_js(JQUERY_URL, type = 'jquery')