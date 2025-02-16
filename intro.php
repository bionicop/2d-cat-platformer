<?php
$storyTexts = [
    "...",
    "*yawns*",
    "*hears voices and movement downstairs*",
    "Hmm... what's going on?",
    "*door closes downstairs*",
    "*car engine starts outside*",
    "My humans... where are they going?",
    "*stomach growls*",
    "And I'm getting hungry...need to find something to eat...",
];
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Cat House Adventure - Intro</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body class="intro-screen">
    <div id="eyelids">
        <div class="eyelid" id="top-eyelid"></div>
        <div class="eyelid" id="bottom-eyelid"></div>
    </div>
    <div id="storyText"></div>
    <div id="skipHint">Press Space or Click to continue</div>
    <div class="page-transition"></div>

    <script>
        const texts = <?php echo json_encode($storyTexts); ?>;
        let currentText = 0;
        let canProgress = false;

        function formatText(text) {
            return text.replace(/\*(.*?)\*/g, '<span class="italic">*$1*</span>');
        }

        function showNextText() {
            if (!canProgress) return;

            const textDiv = document.getElementById('storyText');
            if (currentText < texts.length) {
                textDiv.style.opacity = 0;
                setTimeout(() => {
                    textDiv.innerHTML = formatText(texts[currentText]);
                    textDiv.style.opacity = 1;
                    currentText++;
                }, 500);
            } else {
                const transition = document.querySelector('.page-transition');
                transition.classList.add('active');
                setTimeout(() => {
                    window.location.href = 'index.php?level=1';
                }, 1000);
            }
        }

        setTimeout(() => {
            document.getElementById('eyelids').classList.add('eyes-opening');
            document.body.classList.add('waking-up');
            canProgress = true;
            showNextText();
        }, 1000);

        document.addEventListener('click', showNextText);
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'Enter') {
                showNextText();
            }
        });
    </script>
</body>
</html>
