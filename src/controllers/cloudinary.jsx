import React from "react";
import { Cloudinary } from "@cloudinary/url-gen";
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";
import { AdvancedImage } from "@cloudinary/react";


const TeachersProfile = () => {
  const cld = new Cloudinary({ cloud: { cloudName: "dwdejk1u3" } });

  const cloudinary = require("cloudinary");
  cloudinary.v2.config({
    cloud_name: "dwdejk1u3",
    api_key:process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure: true,
  });

  const img = cld
    .image("cld-sample-5")
    .format("auto")
    .quality("auto")
    .resize(auto().gravity(autoGravity()).width(500).height(500));

  return <AdvancedImage cldImg={img} />;
};

export default TeachersProfile;
