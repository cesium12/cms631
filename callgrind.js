function Callgrind(nodes) {
  var xy = [], v = [], any = [], adj = [], num = nodes.length, color,
      categories = {}, view = {}, cache = {}, center = [ lsize / 2, gsize / 2 ],
      tcanvas = $('<canvas>').attr({ width: 8, height: 1 })[0],
      tctx = tcanvas.getContext('2d'),
      grad = tctx.createRadialGradient(4, 0, 0, 4, 0, 4);
  grad.addColorStop(0, 'orange');
  grad.addColorStop(1, 'blue');
  tctx.fillStyle = grad;
  tctx.fillRect(0, 0, 8, 1);
  colors = [ null, 'orange', 'blue', loctx.createPattern(tcanvas, 'repeat') ];
  
  for(var i = 0; i < num; ++i) {
    xy.push([ ( Math.sin(i * 2 * Math.PI / num)) / 2,
              (-Math.cos(i * 2 * Math.PI / num)) / 2 ]);
    v.push([ 0, 0 ]);
    adj.push({});
    any[i] = false;
    for(var j in nodes[i][6])
      if(i != j)
        any[i] = any[j] = true;
  }
  for(var i = 0; i < num; ++i)
    for(var j in nodes[i][6]) {
      adj[i][j] |= 1;
      adj[j][i] |= 2;
    }
  
  function recalc() {
    for(var i = 0; i < num; ++i)
      $('#' + i).toggle(i in view);
    var kill = [];
    sys.eachNode(function(node) {
      if(!view[node.data.i])
        kill.push(node);
    });
    while(kill.length)
      sys.pruneNode(kill.pop());
    for(var i in view)
      if(!sys.getNode(nodes[i][1]))
        sys.addNode(nodes[i][1], { i: i });
    sys.eachEdge(function(edge) {
      if(!view[edge.source.data.i] || !view[edge.target.data.i])
        kill.push(edge);
    });
    while(kill.length)
      sys.pruneEdge(kill.pop());
    for(var i in view)
      for(var j in nodes[i][6])
        if(view[j] && !sys.getEdges(nodes[i][1], nodes[j][1]).length)
          sys.addEdge(nodes[i][1], nodes[j][1], { length: 10 });
    $('#cats div').hide();
    for(var i in view)
      $('#cats div[h="' + $('#' + i).attr('h') + '"]').show();
  }
  
  this.add = function(fn, button) {
    return function() {
      $(window).resize();
      button.addClass('used');
      $.getJSON('oprofile/' + fn + '.json', function(list) {
        cache[fn] = list;
        for(var i = 0; i < list.length; ++i)
          view[list[i][0]] = true;
        recalc();
      });
    };
  };
  
  this.remove = function(fn, button) {
    return function() {
      $(window).resize();
      button.removeClass('used');
      delete cache[fn];
      view = {};
      for(var f in cache)
        for(var i = 0; i < cache[f].length; ++i)
          view[cache[f][i][0]] = true;
      recalc();
    };
  };
  
  function libname(fname) {
    return categories[fname] || '(unknown)';
  }
  
  function tr(p, k) {
    return p[k] * (zoom - 20) / 2 + center[k];
  }
  
  function colorplot(e, c, o) {
    var h = parseFloat(e.attr('h')), x = parseInt(c * (1 - Math.abs(h % 2 - 1)));
    switch(parseInt(h)) {
      case 0: color = [ c, x, 0 ].join(','); break;
      case 1: color = [ x, c, 0 ].join(','); break;
      case 2: color = [ 0, c, x ].join(','); break;
      case 3: color = [ 0, x, c ].join(','); break;
      case 4: color = [ x, 0, c ].join(','); break;
      case 5: color = [ c, 0, x ].join(','); break;
    }
    e.css('background-color', 'rgba(' + color + ', ' + o + ')');
  }
  
  function drawover(i) {
    loctx.clearRect(0, 0, lsize, gsize);
    loctx.lineWidth = 3;
    loctx.lineCap = 'round';
    $('.select,.highlight').each(function() { colorplot($(this), 128, 0.5); })
                           .removeClass('select highlight');
    $('#info').html('&nbsp;');
    if(i !== undefined) {
      $('#info').html('<b>' + nodes[i][1] + '</b>');
      colorplot($('#cats div[h="' + $('#' + i).attr('h') + '"]').addClass('select'), 192, 1);
      colorplot($('#' + i).addClass('select'), 256, 1);
      for(j in adj[i])
        if(j != i)
          colorplot($('#' + j).addClass('highlight'), 256, 0.8);
      loctx.save();
      loctx.shadowBlur = 5;
      loctx.shadowColor = 'black';
      loctx.beginPath();
      for(j in adj[i])
        if(view[j]) {
          var x1 = tr(xy[i], 0), y1 = tr(xy[i], 1), x2 = tr(xy[j], 0), y2 = tr(xy[j], 1),
              x = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
          if(x1 === x2 && y1 === y2)
            continue;
          loctx.save();
          loctx.translate(x1, y1);
          loctx.rotate(Math.atan2(y2 - y1, x2 - x1));
          loctx.moveTo(10, 0);
          loctx.lineTo(x, 0);
          loctx.restore();
        }
      loctx.stroke();
      loctx.restore();
      for(j in adj[i])
        if(view[j]) {
          var x1 = tr(xy[i], 0), y1 = tr(xy[i], 1), x2 = tr(xy[j], 0), y2 = tr(xy[j], 1),
              x = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
          if(x1 === x2 && y1 === y2)
            continue;
          loctx.save();
          loctx.translate(x1, y1);
          loctx.rotate(Math.atan2(y2 - y1, x2 - x1));
          loctx.strokeStyle = colors[adj[i][j]];
          loctx.beginPath();
          loctx.moveTo(10, 0);
          loctx.lineTo(x, 0);
          loctx.stroke();
          loctx.restore();
        }
    }
  }
  
  function drawplot(things) {
    categories = things;
    var colorlist = [], colormap = {};
    for(var i = 0; i < num; ++i) {
      var lib = libname(nodes[i][1]);
      if(typeof(colormap[lib]) !== 'number') {
        colorlist.push(lib);
        colormap[lib] = 0;
      }
    }
    colorlist.sort();
    for(var i = 0; i < colorlist.length; ++i) {
      colormap[colorlist[i]] = i;
      var h = 6 * i / colorlist.length,
          l = $('<div>').attr('h', h).text(colorlist[i]).appendTo('#cats');
      colorplot(l, 128, 0.5);
      l.mouseover((function(hh) {
        return function() {
          drawover();
          colorplot($('div[h="' + hh + '"]').addClass('highlight'), 256, 1);
        };
      })(h)).mouseout(function() { drawover(); });
    }
    for(var i = 0; i < num; ++i)
      colorplot($('<div>').attr('h', 6 * colormap[libname(nodes[i][1])] / colorlist.length)
                          .attr('id', i).appendTo('#plotc'), 128, 0.5);
    recalc();
  }
  
  var renderer = {
    init: function(system) {
      system.screenSize(1000, 1000);
    },
    redraw: function() {
      var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
      sys.eachNode(function(node, pt) {
        x1 = Math.min(pt.x, x1);
        y1 = Math.min(pt.y, y1);
        x2 = Math.max(pt.x, x2);
        y2 = Math.max(pt.y, y2);
      });
      x1 = (x1 + x2) / 2;
      y1 = (y1 + y2) / 2;
      x2 = x2 - x1;
      y2 = y2 - y1;
      sys.eachNode(function(node, pt) {
        xy[node.data.i] = [ (pt.x - x1) / x2, (pt.y - y1) / y2 ];
      });
    }
  };
  
  function move() {
    var n = undefined, m = 2500;
    if(select) {
      if(zoom > lsize)
        center[0] = select[0] + (lsize / 2 - select[0]) * zoom * 1.1 / lsize;
      if(zoom > gsize)
        center[1] = select[1] + (gsize / 2 - select[1]) * zoom * 1.1 / gsize;
      for(var i in view) {
        var x = tr(xy[i], 0) - select[0], y = tr(xy[i], 1) - select[1],
            d2 = x * x + y * y;
        if(d2 < m)
          n = i, m = d2;
      }
    }
    for(var i in view)
      $('#' + i).css({ left: tr(xy[i], 0), top: tr(xy[i], 1) });
    lctx.clearRect(0, 0, lsize, gsize);
    lctx.lineWidth = 2;
    sys.eachEdge(function(edge) {
      var i = edge.source.data.i, j = edge.target.data.i;
      if(!nodes[i][6][j])
        return;
      var frac = 0.1 + 0.9 * nodes[i][6][j][5] / nodes[i][4];
      lctx.strokeStyle = 'rgba(255, 255, 255, ' + frac + ')';
      lctx.beginPath();
      lctx.moveTo(tr(xy[i], 0), tr(xy[i], 1));
      lctx.lineTo(tr(xy[j], 0), tr(xy[j], 1));
      lctx.closePath();
      lctx.stroke();
    });
    if(parseInt($('#legend').css('padding-right')))
      loctx.clearRect(0, 0, lsize, gsize);
    else
      drawover(n);
  }
  
  var sys = arbor.ParticleSystem(10, 20, 0.6, true, 20);
  //repulsion, stiffness, friction, gravity, fps, and dt
  sys.renderer = renderer;
  $.getJSON('libscan/things.json', drawplot).overrideMimeType('application/json');
  setInterval(move, 1000 / 20);
}
