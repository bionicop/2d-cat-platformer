<?php
$level = isset($_GET['level']) ? intval($_GET['level']) : null;

if ($level === null) {
    header('Location: intro.php');
    exit;
}

$levelFile = "levels/level{$level}.xml";

// Check if the level file exists
if (!file_exists($levelFile)) {
    // If level doesn't exist, either restart at level 1 or show game complete
    $level = 1;
    $levelFile = "levels/level{$level}.xml";
}

$xml = simplexml_load_file($levelFile, "SimpleXMLElement", LIBXML_NOCDATA);
$json = json_encode($xml);
$levelData = json_decode($json, true);
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Cat House Adventure</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="gameContainer">
        <canvas id="gameCanvas" width="1024" height="576"></canvas>
        <div id="subtitle"></div>
    </div>
    <div class="page-transition active"></div>

    <script>
        const LEVEL_DATA = <?php echo json_encode($levelData); ?>;
        const CURRENT_LEVEL = <?php echo $level; ?>;

        // Fade in the game container
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.querySelector('.page-transition').classList.remove('active');
                document.getElementById('gameContainer').classList.add('visible');
            }, 100);
        });
    </script>
    <script src="js/game.js"></script>
</body>
</html>
