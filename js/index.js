var clock = document.querySelector('#utility-clock')
utilityClock(clock)

if (clock.parentNode.classList.contains('fill')) autoResize(clock, 295 + 32)

function utilityClock(container) {
    var dynamic = container.querySelector('.dynamic')
    var hourElement = container.querySelector('.hour')
    var minuteElement = container.querySelector('.minute')
    var secondElement = container.querySelector('.second')
    var scaleMarkerBySecond = new Array(60)
    var markerIsLine = new Array(60)
    var hourMarkers = []
    var hourMarkerSeconds = []
    var trailDuration = 60
    var trailRefreshMs = 1000 / 30
    var trailDeltaThreshold = 0.012
    var lastTrailRefreshAt = -Infinity
    var lastMinuteStrength = new Array(60)
    var lastHourStrength = new Array(12)
    var minute = function(n) {
        return n % 5 == 0 ? minuteText(n) : minuteLine(n)
    }
    var minuteText = function(n) {
        var element = document.createElement('div')
        element.className = 'minute-text'
        element.innerHTML = (n < 10 ? '0' : '') + n
        scaleMarkerBySecond[n % 60] = element
        markerIsLine[n % 60] = false
        position(element, n / 60, 135)
        dynamic.appendChild(element)
    }
    var minuteLine = function(n) {
        var anchor = document.createElement('div')
        anchor.className = 'anchor'
        var element = document.createElement('div')
        element.className = 'element minute-line'
        scaleMarkerBySecond[n % 60] = element
        markerIsLine[n % 60] = true
        rotate(anchor, n)
        anchor.appendChild(element)
        dynamic.appendChild(anchor)
    }
    var hour = function(n) {
        var element = document.createElement('div')
        element.className = 'hour-text hour-' + n
        element.innerHTML = n
        hourMarkers.push(element)
        hourMarkerSeconds.push((n % 12) * 5)
        position(element, n / 12, 105)
        dynamic.appendChild(element)
    }
    var position = function(element, phase, r) {
        var theta = phase * 2 * Math.PI
        element.style.top = (-r * Math.cos(theta)).toFixed(1) + 'px'
        element.style.left = (r * Math.sin(theta)).toFixed(1) + 'px'
    }
    var rotate = function(element, second) {
        element.style.transform = element.style.webkitTransform = 'rotate(' + (second * 6) + 'deg)'
    }
    var strengthFromElapsed = function(elapsed) {
        return Math.max(0, 1 - (elapsed / trailDuration))
    }
    var updateNumberGlass = function(element, strength) {
        // Keep a small glass baseline on numeric markers, then add sweep strength.
        var s = Math.max(0, Math.min(1, 0.22 + 0.78 * strength))
        var r = Math.round(250 + (226 - 250) * s)
        var g = Math.round(252 + (238 - 252) * s)
        var b = Math.round(255 + (248 - 255) * s)
        element.style.color = 'rgb(' + r + ',' + g + ',' + b + ')'
        element.style.textShadow =
            '0 0 ' + (1.5 + 8 * s).toFixed(2) + 'px rgba(255,255,255,' + (0.09 + 0.23 * s).toFixed(3) + '),' +
            '0 0 ' + (1 + 5 * s).toFixed(2) + 'px rgba(188,205,222,' + (0.07 + 0.18 * s).toFixed(3) + ')'
        element.style.filter = 'saturate(' + (1.08 + 0.18 * s).toFixed(3) + ')'
    }
    var updateScaleTrail = function(secondFloat, force) {
        var current = Math.floor(secondFloat) % 60
        var next = (current + 1) % 60
        var t = secondFloat - Math.floor(secondFloat)
        for (var s = 0; s < 60; s++) {
            var marker = scaleMarkerBySecond[s]
            if (!marker) continue

            // Seconds elapsed since the sweep head crossed this marker (0~60).
            var elapsed = (secondFloat - s + 60) % 60
            var strength = strengthFromElapsed(elapsed)
            if (s === current) strength = 1
            if (s === next) strength = t

            if (!force &&
                Math.abs((lastMinuteStrength[s] == null ? -1 : lastMinuteStrength[s]) - strength) < trailDeltaThreshold) {
                continue
            }
            lastMinuteStrength[s] = strength

            if (markerIsLine[s]) {
                if (strength <= 0.001) {
                    marker.style.opacity = ''
                    marker.style.backgroundColor = ''
                    marker.style.boxShadow = ''
                    continue
                }
                var opacity = 0.34 + 0.66 * strength
                marker.style.opacity = opacity.toFixed(3)
                marker.style.backgroundColor = 'rgba(236, 244, 252,' + (0.34 + 0.66 * strength).toFixed(3) + ')'
                marker.style.boxShadow =
                    '0 0 ' + (1 + 8 * strength).toFixed(2) + 'px rgba(255,255,255,' + (0.05 + 0.30 * strength).toFixed(3) + '),' +
                    ' inset 0 0 ' + (1 + 4 * strength).toFixed(2) + 'px rgba(188,205,222,' + (0.04 + 0.24 * strength).toFixed(3) + ')'
                continue
            }
            updateNumberGlass(marker, strength)
        }

        for (var i = 0; i < hourMarkers.length; i++) {
            var hourMarker = hourMarkers[i]
            var hourSecond = hourMarkerSeconds[i]
            var hourElapsed = (secondFloat - hourSecond + 60) % 60
            var hourStrength = strengthFromElapsed(hourElapsed)
            if (hourSecond === current) hourStrength = 1
            if (hourSecond === next) hourStrength = t

            if (!force &&
                Math.abs((lastHourStrength[i] == null ? -1 : lastHourStrength[i]) - hourStrength) < trailDeltaThreshold) {
                continue
            }
            lastHourStrength[i] = hourStrength
            updateNumberGlass(hourMarker, hourStrength)
        }
    }
    var animate = function(frameTime) {
        var now = new Date()
        var time = now.getHours() * 3600 +
                    now.getMinutes() * 60 +
                    now.getSeconds() * 1 +
                    now.getMilliseconds() / 1000
        var secondFloat = now.getSeconds() + now.getMilliseconds() / 1000
        if (frameTime - lastTrailRefreshAt >= trailRefreshMs) {
            updateScaleTrail(secondFloat, false)
            lastTrailRefreshAt = frameTime
        }
        rotate(secondElement, time)
        rotate(minuteElement, time / 60)
        rotate(hourElement, time / 60 / 12)
        requestAnimationFrame(animate)
    }
    for (var i = 1; i <= 60; i ++) minute(i)
    for (var i = 1; i <= 12; i ++) hour(i)
    var initNow = new Date()
    updateScaleTrail(initNow.getSeconds() + initNow.getMilliseconds() / 1000, true)
    requestAnimationFrame(animate)
}

function autoResize(element, nativeSize) {
    var update = function() {
        var scale = Math.min(window.innerWidth, window.innerHeight) / nativeSize
        element.style.transform = element.style.webkitTransform = 'scale(' + scale.toFixed(3) + ')'
    }
    update()
    window.addEventListener('resize', update)
}
