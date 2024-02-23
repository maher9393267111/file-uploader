const express = require("express");
const fs = require("fs")
const path = require("path");

const ratingRouter = express.Router();
// REPO
//https://github.com/davidjumiller/review-scraper/blob/ab9183fad04006a2ee227ec647b8620681d1243c/package.json

const puppeteer = require('puppeteer')

const getReviewCount = async (type, url) => {
  let count = []

  switch (type) {
    case 'google':
      count = await getGoogleReviewCount(url) 
      break;
    case 'facebook':
      count = await getFacebookReviewCount(url)
      break;
    case 'tripadvisor':
      count = await getTripadvisorReviewCount(url)
      break;
    case 'yelp':
      count = await getYelpReviewCount(url)
      break;
    case'grubhub':
      reviews = await getGrubhubReviewCount(url)
      break;
    default:
      console.log('Error: invalid review type specified')
  }

  return count
}

const getGoogleReviewCount = async (url) => {
  const browser = await puppeteer.launch()

  const page = await browser.newPage()

  await page.setDefaultNavigationTimeout(100000)
  await page.goto(url)
  await page.waitForSelector('.HHrUdb')

  let count = await page.$eval('.HHrUdb', el => el.innerHTML)

  await browser.close()

  return parseInt(count)
}

const getReviews = async (type, url) => {
  let reviews = []

  switch (type) {
    case 'google':
      reviews = await getGoogleReviews(url) 
      break;
    case 'facebook':
      reviews = await getFacebookReviews(url)
      break;
    case 'tripadvisor':
      reviews = await getTripadvisorReviews(url)
      break;
    case 'yelp':
      reviews = await getYelpReviews(url)
      break;
    case'grubhub':
      reviews = await getGrubhubReviews(url)
      break;
    default:
      console.log('Error: invalid review type specified')
  }

  return reviews
}

const getGoogleReviews = async (url) => {
  const browser = await puppeteer.launch()

  const page = await browser.newPage()

  await page.setDefaultNavigationTimeout(100000)
  await page.goto(url)
  await page.waitForSelector('.HHrUdb')
  await page.click('.HHrUdb')
  await page.waitForSelector('.jftiEf')
  await scrollPage(page, '.dS8AEf')
  await waitFor(3000);

  const reviews = await page.$$eval('.jftiEf', reviews => {
    return reviews.map(review => {
      return {
        author: review.querySelector('.d4r55')?.textContent.trim(),
        rating: parseFloat(review.querySelector('.kvMYJc')?.getAttribute('aria-label')),
        text: review.querySelector('.wiI7pd')?.textContent.trim(),
        date: review.querySelector(".rsqaWe")?.textContent.trim()
      }
    })
  })
  
  await browser.close()
  return reviews
}


// Copied from serpapi
async function scrollPage(page, scrollContainer) {
  let lastHeight = await page.evaluate(`document.querySelector("${scrollContainer}").scrollHeight`);
  while (true) {
    await page.evaluate(`document.querySelector("${scrollContainer}").scrollTo(0, document.querySelector("${scrollContainer}").scrollHeight)`);
   // await page.waitForTimeout(2000);
    let newHeight = await page.evaluate(`document.querySelector("${scrollContainer}").scrollHeight`);
    if (newHeight === lastHeight) {
      break;
    }
    lastHeight = newHeight;
  }
}
const waitFor = (ms) => new Promise(res => setTimeout(res, ms));




ratingRouter.get("/ratings",  async (req, res) => {
  try {
   
    let testCount = await getReviewCount('google', 'https://www.google.com/maps/place/Julia+Spa+Massage/@40.9918609,29.0277464,17z/data=!3m1!4b1!4m6!3m5!1s0x14cab925e117cd11:0x5ed4d8c7799c1214!8m2!3d40.9918569!4d29.0303213!16s%2Fg%2F11t5j8s_12?entry=ttu')


//   console.log(testCount)
  let testReviews = await getReviews('google', 
  "https://www.google.com/maps/place/Julia+Spa+Massage/@40.9918609,29.0277464,17z/data=!3m1!4b1!4m6!3m5!1s0x14cab925e117cd11:0x5ed4d8c7799c1214!8m2!3d40.9918569!4d29.0303213!16s%2Fg%2F11t5j8s_12?entry=ttu"
//   'https://www.google.com/maps/place/The+Den+-+Arcade+%2B+Drinkery/@49.2874834,-123.1295549,15z/data=!4m5!3m4!1s0x0:0xf73a1ab6a74ab155!8m2!3d49.2874834!4d-123.1295549'
  
  )
  console.log(testReviews)


  // send Data from reviews to books.json
   //const jsonData = JSON.stringify(testReviews)
//await fs.writeFileSync('books.json', jsonData)
  
const data = fs.readFileSync(path.resolve(__dirname, '../books.json'), "utf-8");




    console.log("Data" );
    res.status(200).json({ data:data  });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Catch Error: Internal Server Error.",erroMessage:error?.message });
  }
});




module.exports = { ratingRouter };
