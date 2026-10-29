from pathlib import Path

gesture = Path("app/src/main/java/org/schabi/newpipe/player/gesture/MainPlayerGestureListener.kt")
source = gesture.read_text()

def replace_once(old, new):
    global source
    if source.count(old) != 1:
        raise SystemExit(f"Expected exactly one gesture anchor; found {source.count(old)}: {old[:80]!r}")
    source = source.replace(old, new, 1)

replace_once(
    "    private var isMoving = false\n",
    """    private var isMoving = false
    private var swipeStartX = 0f
    private var swipeStartY = 0f
    private var canToggleFullscreenOnSwipe = false
"""
)

replace_once(
    """        super.onTouch(v, event)
        if (event.action == MotionEvent.ACTION_UP && isMoving) {
  isMoving = false
  onScrollEnd(event)
        }
        return when (event.action) {""",
    """        // Only the centre of the video is used for fullscreen swipes.
        // Preserve left/right brightness and volume sliders and double-tap seeking.
        when (event.actionMasked) {
  MotionEvent.ACTION_DOWN -> {
      swipeStartX = event.x
      swipeStartY = event.y
      canToggleFullscreenOnSwipe =
          getDisplayPortion(event) == DisplayPortion.MIDDLE &&
              !isDoubleTapping && !playerUi.isSomePopupMenuVisible
  }
  MotionEvent.ACTION_POINTER_DOWN -> canToggleFullscreenOnSwipe = false
        }

        super.onTouch(v, event)

        if (event.actionMasked == MotionEvent.ACTION_UP) {
  val verticalTravel = event.y - swipeStartY
  val horizontalTravel = abs(event.x - swipeStartX)
  val swipeThreshold = 64f * v.resources.displayMetrics.density
  val isFullScreenSwipe =
      canToggleFullscreenOnSwipe &&
          !isDoubleTapping &&
          abs(verticalTravel) >= swipeThreshold &&
          abs(verticalTravel) > horizontalTravel * 1.4f &&
          (if (playerUi.isFullscreen) verticalTravel > 0f else verticalTravel < 0f)
  canToggleFullscreenOnSwipe = false
  if (isMoving) {
      isMoving = false
      onScrollEnd(event)
  }
  if (isFullScreenSwipe) {
      // Uses NewPipe's existing fullscreen/orientation handling.
      playerUi.toggleFullscreen()
      return true
  }
        } else if (event.actionMasked == MotionEvent.ACTION_CANCEL) {
  canToggleFullscreenOnSwipe = false
  isMoving = false
        }

        return when (event.action) {"""
)

replace_once(
    """        if (initialEvent == null || !playerUi.isFullscreen) {
  return false
        }

        // Calculate heights of status and navigation bars""",
    """        if (initialEvent == null) {
  return false
        }

        // Centre swipes are reserved for expanding/collapsing fullscreen;
        // do not change brightness or volume while doing these gestures.
        if (getDisplayPortion(initialEvent) == DisplayPortion.MIDDLE) {
  if (abs(movingEvent.y - initialEvent.y) > MOVEMENT_THRESHOLD) {
      isMoving = true
  }
  return true
        }

        if (!playerUi.isFullscreen) {
  return false
        }

        // Calculate heights of status and navigation bars"""
)

gesture.write_text(source)

# A distinct Android application id avoids clashes with previously
# installed Charcoal builds, which use different signing certificates.
gradle = Path("app/build.gradle.kts")
gradle_source = gradle.read_text()
needle = 'resValue("string", "app_name", "NewPipe $workingBranch")'
if gradle_source.count(needle) != 2:
    raise SystemExit("Expected two app-name variants")
gradle.write_text(gradle_source.replace(needle,
    'resValue("string", "app_name", "NewPipe Charcoal")'))
print("Centre swipe up/down gesture patch applied successfully.")
