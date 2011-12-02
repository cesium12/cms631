function Callgrind(id, destroy, center) {
  var interval, title = document.title;
  document.title = title + ' - ' + id;
  this.kill = function() {
    clearInterval(interval);
    lctx.clearRect(0, 0, lsize, gsize);
    loctx.clearRect(0, 0, lsize, gsize);
    document.title = title;
    $('#plot > div').remove();
  }
  
  $.getJSON(id + '/grind.json', function(nodes) {
    var xy, v, any, adj, num = nodes.length, color, categories = {},
        tcanvas = $('<canvas>').attr({ width: 8, height: 1 })[0],
        tctx = tcanvas.getContext('2d'),
        grad = tctx.createRadialGradient(4, 0, 0, 4, 0, 4);
    grad.addColorStop(0, 'orange');
    grad.addColorStop(1, 'blue');
    tctx.fillStyle = grad;
    tctx.fillRect(0, 0, 8, 1);
    colors = [ null, 'orange', 'blue', loctx.createPattern(tcanvas, 'repeat') ];
    
    if(Callgrind.cache[id]) {
      xy = Callgrind.cache[id][0];
      v = Callgrind.cache[id][1];
      any = Callgrind.cache[id][2];
      adj = Callgrind.cache[id][3];
    } else {
      xy = [];
      v = [];
      any = [];
      adj = [];
      Callgrind.cache[id] = [ xy, v, any, adj ];
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
    }
    
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
      $('#info').html('');
      if(i !== undefined) {
        $('#info').html('<b>' + nodes[i][1] + '</b><br>total ' + nodes[i][4] + ' / self ' + nodes[i][5]);
        colorplot($('#legend div[h="' + $('#' + i).attr('h') + '"]').addClass('select'), 192, 1);
        colorplot($('#' + i).addClass('select'), 256, 1);
        for(j in adj[i])
          if(j != i)
            colorplot($('#' + j).addClass('highlight'), 256, 0.8);
        loctx.save();
        loctx.shadowBlur = 5;
        loctx.shadowColor = 'black';
        loctx.beginPath();
        for(j in adj[i]) {
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
        for(j in adj[i]) {
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
        colorplot($('<div>').attr('h', 6 * i / colorlist.length)
                            .text(colorlist[i]).appendTo('#legend'), 128, 0.5);
      }
      for(var i = 0; i < num; ++i)
        colorplot($('<div>').attr('h', 6 * colormap[libname(nodes[i][1])] / colorlist.length)
                            .attr('id', i).appendTo('#plot'), 128, 0.5);
      for(var i = 0; i < num; ++i)
        if(libname(nodes[i][1]) === '(unknown)')
          console.log(nodes[i][1]);
    }
    
    function drawline() {
      lctx.clearRect(0, 0, lsize, gsize);
      for(var i = 0; i < num; ++i) {
        $('#' + i).css({ left: tr(xy[i], 0), top: tr(xy[i], 1) });
        for(var j in nodes[i][6]) {
          var frac = 0.1 + 0.9 * nodes[i][6][j][5] / nodes[i][4];
          lctx.strokeStyle = 'rgba(255, 255, 255, ' + frac + ')';
          lctx.beginPath();
          lctx.moveTo(tr(xy[i], 0), tr(xy[i], 1));
          lctx.lineTo(tr(xy[j], 0), tr(xy[j], 1));
          lctx.closePath();
          lctx.stroke();
        }
      }
    }
    
    function updateselect(m) {
      var n = undefined;
      if(select)
        for(var i = 0; i < num; ++i) {
          var x = tr(xy[i], 0) - select[0], y = tr(xy[i], 1) - select[1],
              d2 = x * x + y * y;
          if(d2 < m)
            n = i, m = d2;
        }
      drawover(n);
    }
    
    function move() {
      if(select) {
        if(zoom > lsize)
          center[0] = select[0] + (lsize / 2 - select[0]) * zoom * 1.1 / lsize;
        if(zoom > gsize)
          center[1] = select[1] + (gsize / 2 - select[1]) * zoom * 1.1 / gsize;
      }
      if(zoom < minzoom)
        destroy();
      var com = [ 0, 0 ];
      for(var i = 0; i < num; ++i) {
        if(!any[i])
          continue;
        var xy1 = xy[i];
        for(var j in nodes[i][6]) {
          var xy2 = xy[j], diff = [ xy2[0] - xy1[0], xy2[1] - xy1[1] ],
              d2 = diff[0] * diff[0] + diff[1] * diff[1];
          if(d2 < 1e-8)
            continue;
          var d = Math.sqrt(d2), x = 0.1 + 0.9 * nodes[i][6][j][5] / nodes[i][4];
          for(var k = 0; k < 2; ++k) {
            v[i][k] += 2e-3 * x * diff[k] / d * (d - 5e-2);
            v[j][k] -= 2e-3 * x * diff[k] / d * (d - 5e-2);
          }
        }
        for(var j = 0; j < num; ++j) {
          var xy2 = xy[j], diff = [ xy2[0] - xy1[0], xy2[1] - xy1[1] ],
              d2 = diff[0] * diff[0] + diff[1] * diff[1];
          if(d2 < 1e-8)
            continue;
          for(var k = 0; k < 2; ++k) {
            v[i][k] -= 3e-6 * diff[k] / d2;
            v[j][k] += 3e-6 * diff[k] / d2;
          }
        }
      }
      for(var i = 0; i < num; ++i)
        if(any[i])
          for(var k = 0; k < 2; ++k)
            v[i][k] *= 0.95;
      for(var i = 0; i < num; ++i)
        if(any[i])
          for(var k = 0; k < 2; ++k) {
            xy[i][k] += v[i][k];
            com[k] += xy[i][k];
          }
      for(var i = 0; i < num; ++i)
        if(any[i]) {
          xy[i][0] -= com[0] / num;
          xy[i][1] -= com[1] / num;
          var d = Math.sqrt(xy[i][0] * xy[i][0] + xy[i][1] * xy[i][1]);
          if(d > 1) {
            xy[i][0] /= d;
            xy[i][1] /= d;
          }
        }
      drawline();
      updateselect(2500);
    }
    
    $.getJSON('libscan/things.json', drawplot).overrideMimeType('application/json');
    interval = setInterval(move, 100);
  }).overrideMimeType('application/json');
}
Callgrind.cache = {};
