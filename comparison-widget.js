

(function ($) {

  var vs_defaults = {
    threshold: 80
  };


  $.fn.isoVisualize = function isoFactory (options) {
    options = options || vs_defaults;

    var _threshold = options.threshold || vs_default.threshold;

    function create (v, i) {
      var el = $(this);
      var config = el.data( );


      var height = el.height( );
      var width = el.width( );

      var _other = config.otherTarget ? +$(config.otherTarget).val( ) : config.otherValue;
      var _cgm = config.cgmTarget ? +$(config.cgmTarget).val( ) : config.cgmValue;
      var guards = {
        max: 400
      , min: 40
      };
        
      var values = {
        other: (+_other)
      , cgm: (+_cgm)
      , spread: +config.range
      , threshold: +(config.threshold || _threshold)
      };

      var condition = 'percent';
      var pct = (values.spread/100);
      var delta = (values.other - values.cgm ) /  values.other;
      var alignment = {
        mid:values.other
      , min: Math.max(values.other - (values.other * (pct + 0)), guards.min)
      , max: values.other + (values.other * (pct + 0))
      };
      var aligned = (delta <= (pct));
      var inner = {
        min: Math.max(values.other - (values.other * (pct/2)), guards.min)
      , max: values.other + (values.other * (pct/2))
      };
      var outer = {
        min: Math.max(values.other - (values.other * (pct * 2)), guards.min)
      , max: values.other + (values.other * (pct * 2))
      };

      if (values.other < values.threshold) {
        condition = 'points';
        delta = values.other - values.cgm;
        aligned = delta < values.spread;
        inner = {
          min: Math.max(values.other - (values.spread * (1)), guards.min)
        , max: values.other + (values.spread * (1))
        };
        outer = {
          min: Math.max(values.other - (values.spread * (2)), guards.min)
        , max: values.other + (values.spread * (2))
        };
      }


      var result = {
        delta: delta
      , aligned: aligned
      , inner: inner
      , outer: outer
      , condition: condition
      , threshold: values.threshold
      };

      var domain = {
        max: result.outer.max
      , min: result.outer.min
      };
      var margin = {
        top: 10
      , bottom: 10
      , left: 0
      , right: 0
      };
      var size = {
        width: width - margin.left - margin.right
      , height: height - margin.top - margin.bottom
      };
      var range = {
        max: size.height
      , min: 0
      };

      var upper = {
        outside: {y: result.outer.max, max: result.outer.max, min: alignment.max }
      , inside: { y: alignment.max,  max: alignment.max, min: values.other }
      , max: result.outer.max
      , mid: result.inner.max
      , min: values.other
      , name: 'upper'
      };
      var lower = {
        outside: { y: alignment.min, max: alignment.min, min: result.outer.min }
      , inside: { y: values.other, max: values.other, min: alignment.min }
      , max: values.other
      , mid: result.inner.min
      , min: result.outer.min
      , name: 'lower'
      };




      console.log('config', this, config, values,  delta, domain, range, result, upper, lower);

      var svg = d3.select(this)
        .append("svg")
          .attr("width", size.width + margin.left + margin.right)
          .attr("height", size.height + margin.top + margin.bottom)
        .append("g")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

      // Add Y axis
      var y = d3.scaleLinear().domain([domain.min, domain.max]).range([ range.max, range.min]);
      var x = d3.scaleLinear().domain([0, 100]).range([ 0, size.width]);

      svg
        .append("g")
          .classed("grid", true)
          .attr("transform",
                "translate(" + x(50) + "," + 0 + ")")
         .call(d3.axisRight(y).ticks(5).tickSize(-size.width, 0, 0));
      // svg .append("g") .call(d3.axisBottom(x));



      function create_threshold (d) {
        var outside = {
          y: y(d.outside.y)
        , height: y(d.outside.min) - y(d.outside.max)
        };
        var inside = {
          y: y(d.inside.y)
        , height: y(d.inside.min) - y(d.inside.max)
        };
				d.diff = y(d.min) - y(d.max);
				d.quartile = y(d.mid) - y(d.max);
				// d.quartile = d.diff/2;
        console.log('create threshold', this, d);
        var group = d3.select(this).append("g")
          .attr("class", "thresholds")
          ;
          group.append("rect")
            .classed(d.name, true)
            .attr("width", x(50))
            .attr("x", x(0))
            .attr("y", y(d.max))
            .attr("height", d.diff)
            ;
          group.append("rect")
            .classed(d.name + " outside", true)
            .attr("width", x(50))
            .attr("height", outside.height)
            .attr("y", outside.y)
            .attr("x", x(0))
            ;
          group.append("rect")
            .classed(d.name + " inside", true)
            .attr("width", x(50))
            .attr("height", inside.height)
            .attr("y", inside.y)
            .attr("x", x(0))
            ;

      }

      function create_values (d) {
        var group = d3.select(this);

        group.append("circle")
          .attr("cx", x(25))
          .attr("cy", y(d.value))
          .attr("r", 5)
          .attr("class", d.label)
          ;
          // .attr("", y(d.value));
        group.append("line")
          .attr("x1", x(0))
          .attr("x2", x(80))
          .attr("y1", y(d.value))
          .attr("y2", y(d.value));
				group.append("text")
						.attr("text-anchor", "start")
						.attr("x", x(51))
						.attr("y", y(d.value))
						.text([d.value, d.label].join(" "))
            ;

      }

      var otherValue = {
        value: values.other
      , label: 'Meter'
      };

      var cgmValue = {
        value: values.cgm
      , label: 'CGM'
      };

      var root = svg.append("g")
        .classed("isAligned", result.aligned)
        .classed("isUnaligned", !result.aligned)
        ;
      var compartments = root.selectAll('g.compartments').data([upper, lower]);
      compartments.enter( ).append('g').classed('compartments', true).each(create_threshold);

      var readings = root.selectAll("g.values").data([otherValue, cgmValue]);
      readings.enter( ).append('g').classed('values', true).each(create_values);
      // var targets = root.selectAll("g.target").data([alignment]);

        console.log("config", config);
      $(config.otherTarget).on('change', function (ev) {
        el.empty( );
        el.isoVisualize( );
        
      });
    }

    return this.each(create);
  }

  function init ( ) {
    $('[data-range]').isoVisualize( );
  }

  $(document).ready(init);

})(jQuery);

  


