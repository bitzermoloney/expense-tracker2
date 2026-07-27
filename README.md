# expense-tracker2
A full stack expense tracker

To begin, I thought about what I wanted my program to be able to do:
- Have a login/register system
    This will need to use a database that holds the users information for when they try to log in, which may be a good opportunity to expand my file handling skills
- Have a system whereby the user can add, delete, edit and view their expenses, putting them into catagories
    This will need to use a child database for each user's expenses
- Have a dashboard, where the user can see their expenses, charts, monthly statements and so on

I also thought about some extra things that I could add to make the program even better afterwards:
- The ability for the user to download PDF statements of their expenses

# STEP 1: SETTING UP A LOGIN AND REGISTER SYSTEM
To set up a login and register system, I would need to:
- Set up a backend API
- Create a frontend UI
- Create the login and register system

The backend API is seen in server.js, which I wrote in javascript. It has been annotated.

The frontend UI is seen in index.html and app.js. I chose to use HTML because it is standard for creating UIs, and used javascript because it complements the functionality of HTML code well. Before this project I was already pretty good at HTML, but have had to expand my skills in javascript which I had rarely used before.

I was also able to show off some SQL skills in server.js, which is used for handling, searching from and writing to the database being used.

# STEP 2: ADDING THE EXPENSE EDIT PAGE
Next I added the page where the user can edit their expenses, in the app.js file and html file.

# STEP 3: DECENTRALISING
After adding the basic functionality, I needed to make it so that the expense edit page is accessed afetr the user is logged in. To do this, I made changes to app.js and esnured the flow now opens the expense tracker after login.