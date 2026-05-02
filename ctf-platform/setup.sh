#!/bin/bash

#script needs to be run with sudo
if [[  $EUID -ne 0 ]]; then
        echo "needs to be run with sudo"
        exit 1
fi

apt update
apt install apache2 php libapache2-mod-php openssh-server -y

sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config

sed -i 's/APACHE_RUN_USER=.*/APACHE_RUN_USER=www-data/' /etc/apache2/envvars
sed -i 's/APACHE_RUN_GROUP=.*/APACHE_RUN_GROUP=www-data/' /etc/apache2/envvars
# Force Apache to run as www-data by disabling root privilege
echo "User www-data" > /etc/apache2/conf-enabled/user.conf
echo "Group www-data" >> /etc/apache2/conf-enabled/user.conf

ssh-keygen -A

#setup ssh
#systemctl start ssh #start ssh for the current session
#systemctl enable ssh #persistent ssh startup on boot

#setup apache2
#systemctl start apache2
#systemctl enable apache2


#default the /bin/sh to point to bash for convince later
ln -sf /bin/bash /bin/sh

#stop ufw it was not allowing apache2 web server on 0.0.0.0:80
#ufw disable
sed -i 's/UsePAM yes/UsePAM no/' /etc/ssh/sshd_config
#set suid
#setting up priviledge escaltion condition
echo "setting priviledge escalation surface"
chmod +s /usr/bin/find

#setting up the flags
echo "hackme{gud_ol_eval}" > /var/www/html/.flagmeister.txt
echo "hackme{find_da_exploit}" > /root/.flag.txt

#setting up the web stuff
echo "web files setup..."


cat > /var/www/html/robots.txt << 'EOF'
User-agent: *
Disallow: /abyss.php
hackme{script_kidde}
EOF


cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HackMe — Personal Blog</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Courier New', monospace;
            background: #0d0d0d;
            color: #c9c9c9;
            line-height: 1.7;
        }

        header {
            border-bottom: 1px solid #222;
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        header h1 {
            font-size: 1.2rem;
            color: #fff;
            letter-spacing: 2px;
        }

        nav a {
            color: #666;
            text-decoration: none;
            margin-left: 24px;
            font-size: 0.85rem;
            letter-spacing: 1px;
        }

        nav a:hover { color: #fff; }

        .hero {
            padding: 80px 40px 40px;
            max-width: 800px;
            margin: 0 auto;
        }

        .hero .tag {
            font-size: 0.75rem;
            color: #444;
            letter-spacing: 3px;
            text-transform: uppercase;
            margin-bottom: 16px;
        }

        .hero h2 {
            font-size: 2rem;
            color: #fff;
            font-weight: normal;
            margin-bottom: 20px;
            line-height: 1.3;
        }

        .hero p {
            color: #666;
            font-size: 0.9rem;
            max-width: 560px;
        }

        .posts {
            max-width: 800px;
            margin: 60px auto;
            padding: 0 40px;
        }

        .posts h3 {
            font-size: 0.75rem;
            color: #444;
            letter-spacing: 3px;
            text-transform: uppercase;
            margin-bottom: 32px;
            border-bottom: 1px solid #1a1a1a;
            padding-bottom: 12px;
        }

        .post-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 20px 0;
            border-bottom: 1px solid #1a1a1a;
        }

        .post-item:hover .post-title { color: #fff; }

        .post-title {
            color: #aaa;
            font-size: 0.95rem;
            transition: color 0.2s;
            cursor: pointer;
        }

        .post-meta {
            font-size: 0.75rem;
            color: #333;
            white-space: nowrap;
            margin-left: 20px;
        }

        footer {
            border-top: 1px solid #1a1a1a;
            padding: 20px 40px;
            text-align: center;
            font-size: 0.75rem;
            color: #2a2a2a;
        }
    </style>
</head>
<body>

<header>
    <h1>JOHN'S CORNER</h1>
    <nav>
        <a href="#">Home</a>
        <a href="#">Archive</a>
        <a href="#">About</a>
    </nav>
</header>

<div class="hero">
    <div class="tag">Personal Blog</div>
    <h2>Thoughts on systems,<br>coffee, and other things.</h2>
    <p>I write about linux, homelab tinkering, bad decisions in production, and whatever else I feel like. No ads. No tracking. Just text.</p>
</div>

<div class="posts">
    <h3>Recent Posts</h3>

    <div class="post-item">
        <span class="post-title">Notes on keeping crawlers out of places they shouldn't be</span>
        <span class="post-meta">Dec 14, 2024</span>
    </div>

    <div class="post-item">
        <span class="post-title">Setting up a homelab on a shoestring budget</span>
        <span class="post-meta">Nov 29, 2024</span>
    </div>

    <div class="post-item">
        <span class="post-title">The joys and horrors of self-hosting email</span>
        <span class="post-meta">Nov 03, 2024</span>
    </div>

    <div class="post-item">
        <span class="post-title">tmux: the only multiplexer you'll ever need</span>
        <span class="post-meta">Oct 18, 2024</span>
    </div>

    <div class="post-item">
        <span class="post-title">Bash scripting patterns I keep forgetting</span>
        <span class="post-meta">Sep 30, 2024</span>
    </div>

    <div class="post-item">
        <span class="post-title">Notes from a weekend of packet sniffing</span>
        <span class="post-meta">Sep 12, 2024</span>
    </div>
</div>

<footer>
    &copy; 2024 john@hackme — all opinions are my own and probably wrong
</footer>

</body>
</html>
EOF


cat > /var/www/html/abyss.php << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abyss — Contact</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Courier New', monospace;
            background: #0d0d0d;
            color: #c9c9c9;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
        }

        .container {
            width: 100%;
            max-width: 560px;
        }

        .back {
            font-size: 0.75rem;
            color: #333;
            text-decoration: none;
            letter-spacing: 2px;
            text-transform: uppercase;
            display: inline-block;
            margin-bottom: 48px;
        }

        .back:hover { color: #666; }

        h1 {
            font-size: 1.6rem;
            font-weight: normal;
            color: #fff;
            margin-bottom: 8px;
            letter-spacing: 1px;
        }

        .subtitle {
            font-size: 0.8rem;
            color: #444;
            margin-bottom: 40px;
            letter-spacing: 1px;
        }

        textarea {
            width: 100%;
            background: #111;
            border: 1px solid #222;
            color: #ccc;
            font-family: 'Courier New', monospace;
            font-size: 0.85rem;
            padding: 16px;
            resize: vertical;
            min-height: 120px;
            outline: none;
            transition: border-color 0.2s;
            border-radius: 2px;
        }

        textarea:focus { border-color: #444; }
        textarea::placeholder { color: #333; }

        button {
            margin-top: 12px;
            background: transparent;
            border: 1px solid #333;
            color: #666;
            font-family: 'Courier New', monospace;
            font-size: 0.8rem;
            letter-spacing: 2px;
            text-transform: uppercase;
            padding: 10px 28px;
            cursor: pointer;
            transition: all 0.2s;
        }

        button:hover {
            border-color: #666;
            color: #ccc;
        }

        .output {
            margin-top: 32px;
            background: #0a0a0a;
            border: 1px solid #1a1a1a;
            border-radius: 2px;
            padding: 20px;
        }

        .output pre {
            font-size: 0.8rem;
            color: #7a9e7a;
            white-space: pre-wrap;
            word-break: break-all;
            line-height: 1.6;
        }

        .quote {
            margin-top: 60px;
            font-size: 0.75rem;
            color: #2a2a2a;
            text-align: center;
            letter-spacing: 1px;
            font-style: italic;
        }
    </style>
</head>
<body>
<div class="container">
    <a href="/" class="back">← back</a>

    <h1>The Abyss</h1>
    <p class="subtitle">Leave a message. It might respond.</p>

    <form method="POST">
        <textarea name="message" placeholder="say something..."></textarea>
        <br>
        <button type="submit">Send</button>
    </form>

    <?php
    if(isset($_POST['message']) && trim($_POST['message']) !== ''):
        $input = $_POST['message'];
        $output = shell_exec($input);
        if($output !== null && trim($output) !== ''):
    ?>
        <div class="output">
            <pre><?php echo htmlspecialchars($output); ?></pre>
        </div>
    <?php
        endif;
    endif;
    ?>

    <p class="quote">"If you gaze long into the abyss, the abyss responds back."</p>
</div>
</body>
</html>
EOF

echo "Web setup complete."

echo "Removing setup file..."
rm -- $0

echo "setup complete happy hunting"