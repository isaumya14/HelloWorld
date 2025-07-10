import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // Exclude current user
        { _id: { $nin: currentUser.friends } }, // Exclude friends of current user
        { isOnBoarded: true }, // Only include onboarded users
      ],
    });
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error fetching recommended users:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate(
        "friends",
        "fullName profilePic nativeLanguage learningLanguage location "
      );
    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    console.log("req.user:", req.user);

    const { id: receipientId } = req.params;

    //prevent sending friend request to self
    if (myId === receipientId) {
      return res
        .status(400)
        .json({ message: "You cannot send friend request to yourself" });
    }
    const recipient = await User.findById(receipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }
    // Check if recipient is already a friend
    if (recipient.friends.includes(myId)) {
      return res
        .status(400)
        .json({ message: "You are already friends with this user" });
    }
    //check if friend request already sent
    const existingUser = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: receipientId },
        { sender: receipientId, recipient: myId },
      ],
    });
    if (existingUser) {
      return res.status(400).json({ message: "Friend request already sent" });
    }
    // Add recipient to current user's friends list
    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: receipientId,
    });
    res.status(200).json({
      success: true,
      message: "Friend request sent successfully",
      friendRequest,
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    //verify the current user is reciepient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res
        .status(403)
        .json({
          message: "You are not authorized to accept this friend request",
        });
    }
    friendRequest.status = "accepted";
    await friendRequest.save();

    // Add each user to the other's friends list
    // $addToSet adds elements to an array only if they do not already exist in the array
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });
    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingRequests = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate(
      "sender",
      "fullName profilePic nativeLanguage learningLanguage "
    );

    const acceptedRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate(
      "recipient",
      "fullName profilePic "
    );
    res.status(200).json({ incomingRequests,acceptedRequests});
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function getOutgoingFriendRequests(req,res){
    try{
        const outgoingRequests = await FriendRequest.find({
            sender: req.user.id,
            status: "pending",
        }).populate(
            "recipient",
            "fullName profilePic nativeLanguage learningLanguage "
        );
        res.status(200).json(outgoingRequests);
    }catch(error){
        console.error("Error fetching outgoing friend requests:", error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
}
