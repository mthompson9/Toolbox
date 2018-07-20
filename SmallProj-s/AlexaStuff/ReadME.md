HOW TO DO I GET THE SKILLS ON MY ALEXA
    - Currenlty the Skills are in a developent state so you cannot just search and download them like normal. 
        - This is as there were concerns about the code/skill being too widely accessible. 
        - To have the skill on your account you will need to get it to the development state on your own alexa developer account.

    HOW DO I CREATE AN ALEXA DEVELOPER ACCOUNT
        - Go to: https://developer.amazon.com/alexa-skills-kit
        - Create an account. 
        - In the upper-right corner, click 'your alexa consoles', then click skills.
        - You also need an aws account as the skills are hosted via AWS, so; 
            - go to: https://console.aws.amazon.com/lambda
            - either log in or create an account. 
            - Create an instance in the North Vrigina region. IT MUST BE THIS REGION
            - Create a function for the skill. Call it whatever you want.

SETTING UP YOUR COPY SKILLS
    - watch the Alexa Skills Kit Tutorial video. 
    - Make sure you set your skill regiion to the region you want to use it in (U.K.)
    - Your invocation Name is: 'Safety Lookup' (for the Chemical codes lookup) & 'store order' (for the store order form)
        - All info regarding how the skill works can be found in the interactionModel.json file in the skills folder.
        - You can copy this interactionModel.js and paste it in the 'JSON editor' section of the skills kit. All info on how to configure the skill will be there.
        - Your Slot types should auto populate. If they dont, just translate from the json to the input sections in the UI. 
    - To connect your skill to the AWS you need to copy the ARN which will be in the TOP RIGHT of the AWS LABMDA console and always starts with 'ARN:'
        - Copy this into your skills kit. 
        - Make sure you Build Skill. Any errors in your configuration will be found here.
        - Go back and follow the steps from this ReadME/the tutorial video. 
    - In your AWS console, select the desired funciton, make sure youre in the configuration page. 
    - There will be a pane named 'Designer'. 
        - From the left hand pane in Designer select Alexa Skills Kit as your trigger.
            - You will be prompted to connect the AWS to the skill with the skills unique reference. You can get this from your Alexa skills console.
    - The pane undereath Designer is 'Function Code'. 
        - Click file upload
        - Select the COMPRESSED verison of the UploadFolder.
        - Its important you upload just the UploadFolder. 
        - It will contain a node_modules folder for you so you dont need to run any installs or anything.
    - Hit Save. 
    - To test, Select Configure Test Events. 
        - Copy and paste the test.json file in the relevant skill folder.
        - Save
    - Hit Test. 
    - Hopefully you see green and not red. If so, Save, You will be good to go. 
    - Login to your alexa mobile app (Using the same email you used to create your developer consoles), follow the setup instructions. 
    - Hi the Menu button in the top left 
        - Hit Skills
            - Hit your Skills in the upper right corner. 
            - You should see your skills. 
            - You can go ahead and begin to use it. 

I CANT INVOKE MY SKILLS. 
    - Please go the alexa skills kit developer console. 
    - Sign in, select your skill
    - Check your Skill invocation name. Make sure you're saying ' Ask [skill invocation name] to' or 'Launch [skill invocation name] and' 
    - Follow this by checking your intent section and make sure youre using it straight after ^^^ the dialogue here ^^^. 
    - If it still isn't working. Check for errors, when you hit build and test on the AWS console to see errors there. 
    - If it Persists please contact me at: mthompson.dev.work@gmail.com


HOW DO I UPDATE THE SKILLS
    - To edit the skills, try using the aws lambda console. 
    - However some of the skills are simply too big to be edited inline on the console. 
    - So you have to edi tthe local files you have downloaded and then compress all necessary files to run including the index.js and node modules folder. Then upload this .zip on the lambda console.


