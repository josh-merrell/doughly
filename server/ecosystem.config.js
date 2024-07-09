// add this file to the API EC2 Server whenever you replace it. place it in /home/ubuntu. 'deploy-api-ec2-prod' github action will use it to start pm2 process
// also run the following on new EC2 ubuntu instances to install node, nvm, pm2

const { kill } = require('process');

/**
**INSTALL NODE
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey`/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
NODE_MAJOR=22
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt-get update
sudo apt-get install nodejs -y

**INSTALL PM2
sudo npm install pm2@latest -g

**ADD NEW EC2 TO 'doughly-api-servers' target-group in the EC2 Load Balancer, use port 3000

**RUN AND SETUP PM2
  - 'pm2 start ecosystem.config.js' from ~/
  - 'pm2 save' from ~/
  - 'pm2 startup' from ~/
  - 'sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu' from ~/ (or run whatever the output of the previous command is)
  now pm2 will restart on reboot
  
**/
module.exports = {
  apps: [
    {
      name: 'doughly',
      script: '/home/ubuntu/dl/server.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1028M',
      exp_backoff_restart_delay: 100,
      instances: 1,
      listen_timeout: 8000,
      kill_timeout: 2000,
      env: {
        NODE_ENV: 'production',
        NODE_HOST: 'http://localhost',
        PORT: '3000',
        LOCAL_TAX_RATE: '0.07',
        MEASUREMENT_UNITS:
          'block,gram,drop,drizzle,can,clove,kilogram,pint,fluidOunce,fillet,head,weightOunce,pound,kernel,teaspoon,tablespoon,cup,quart,gallon,milliliter,liter,leaf,loaf,packet,bag,box,carton,pallet,bottle,sprig,strip,sheet,sprinkle,container,bunch,dash,pinch,bar,stalk,stick,slice,single,dozen,rib',

        //SUPABASE
        SUPABASE_ACCOUNT_PW: '!qFzFGxmZ@9pcR6',
        SUPABASE_DOUGHLEAP_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsc3ZjZXV4b2lheWhpYnJ3b2JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4Mzk1OTQwOCwiZXhwIjoxOTk5NTM1NDA4fQ.vlONaLXchEoMGKUNHZPvBc58sXRU-yiWwoRoWyeIiUQ',
        SUPABASE_DOUGHLEAP_URL: 'https://jlsvceuxoiayhibrwobf.supabase.co',
        SUPABASE_DOUGHLEAP_PERSONAL_TOKEN: 'sbp_706ee62c23a9f701802426ce0f553b0517920a53',
        SUPABASE_DOUGHLEAP_DB_PASSWORD: 'dbConnect123!',
        SUPABASE_USER_EMAIL: 'joshmerrell.us@gmail.com',
        SUPABASE_USER_PW: 'ginger93!',

        //AWS
        AWS_ACCESS_KEY_ID: 'AKIASN6TRMFANQHTJNO3',
        AWS_SECRET_ACCESS_KEY: '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',
        AWS_REGION: 'us-west-2',
        AWS_IMAGE_BUCKET_NAME: 'dl.images',
        AWS_TEMP_IMAGE_BUCKET_NAME: 'dl.temp-images',
        AWS_BACKUP_BUCKET_NAME: 'dl.backups',
        AWS_ID_CACHE_REDIS_HOST: 'dl-prod-id-sequence-cache-001.enkinf.0001.usw2.cache.amazonaws.com',

        //OAUTH
        SUPABASE_GOOGLE_OAUTH_CLIENT_ID: '911585064385-1ei5d9gdp9h1igf9hb7hqfqp466j6l0v.apps.googleusercontent.com',
        SUPABASE_GOOGLE_OAUTH_CLIENT_SECRET: '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',
        SUPABASE_GOOGLE_OAUTH_CALLBACK_URL: 'https://jlsvceuxoiayhibrwobf.supabase.co/auth/v1/callback',

        //OPENAI
        OPENAI_API_KEY: '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',
        OPENAI_ORG_ID: 'org-GuHibS3Y06woyL0PLqn5FLsr',

        //SOCIAL MEDIA
        FB_APP_ID: '399157002973005',
      },
    },
  ],
};
