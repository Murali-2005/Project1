const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing=require("./models/listing.js");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
let wrapAsync=require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");
const Review=require("./models/review.js");
const {reviewSchema}=require("./schema.js");

const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";

main().then(()=>{
    console.log("connected to DB");
}).catch(err =>{
    console.log(err);
});

async function main(){
    await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));


app.get("/", (req, res)=>{
    res.send("This is Root page");
});

const validateReview = (req, res, next) => {
    let {error} = reviewSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
     }else{
        next();
     }
};

//INDEX ROUTE
app.get("/Listings", wrapAsync (async(req, res)=>{
    const allListings= await Listing.find({});
    res.render("listings/index.ejs", {allListings});
}));

//NEW ROUTE
app.get("/listings/new", (req, res)=>{
    res.render("listings/new.ejs");
});


//SHOW ROUTE
app.get("/listings/:id",wrapAsync( async(req, res)=>{
    let{id}=req.params;
    const listing= await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs", {listing});
}));

//CREATE ROUTE
app.post("/listings", wrapAsync( async(req, res, next)=>{
    // let{title, description, image, price, country, location}=req.body
    
        const newListing=new Listing(req.body.listing);
        await newListing.save();
        res.redirect("/listings");
    
}));

//EDIT ROUTE
app.get("/listings/:id/edit", wrapAsync(async(req, res)=>{
    let{id}=req.params;
    const listing= await Listing.findById(id);
    res.render("listings/edit.ejs", {listing});
}));

//UPDATE ROUTE
app.put("/listings/:id", wrapAsync(async (req, res)=>{
     let{id}=req.params;
     await Listing.findByIdAndUpdate(id, {...req.body.listing});
    res.redirect(`/listings/${id}`);
}));

//DELETE ROUTE
app.delete("/listings/:id", wrapAsync(async (req, res)=>{
    let{id}=req.params;
    let deleted= await Listing.findByIdAndDelete(id);
    console.log(deleted);
    res.redirect("/listings");
}));

//Reviews
//Post Route
app.post("/listings/:id/reviews", validateReview, wrapAsync(async(req, res)=>{
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);

    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    res.redirect(`/listings/${listing._id}`);
}));

//Delete review route
app.delete("/listings/:id/reviews/:reviewId", wrapAsync( async (req, res) => {
    let{id, reviewId} = req.params;
    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    
    res.redirect(`/listings/${id}`);
}));

// app.get("/testListing", async(req, res)=>{
//     let sampleListing = new Listing({
//         title: "My New Villa",
//         description: "By the beach",
//         price:1200,
//         location:"Calangute, Goa",
//         country:"India",
//     });

//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful testing");
// });

// app.all('*', (req, res, next)=>{
//     next(new ExpressError(404, "Page Not Found!"));
// });

app.use((err, req, res, next)=>{
    // let{statusC, message}=err;
    // res.status(statusC).send(messsage);
    res.send("Something went wrong!");
});

app.listen(8080, ()=>{
    console.log("Listening to port 8080");
});