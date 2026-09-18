WE need to test 100 live users active users in this web how much load coming on this app 


Check api load and server load 


add this template 

====================================
TEMPLATE: emergency_contact_added
====================================
Category: Utility
Language: en
Variable Type: Name   <-- SET THIS DROPDOWN TO "Name" BEFORE TYPING BODY. If left on "Number", MSG91 will reject {{contact_name}} with "Var
iables parameters must be whole numbers..."
Header: None

Body:
Hi {{contact_name}}, {{owner_name}} has added you as an emergency contact on their RapiQR safety tag. If they are ever in an emergency, you
 may be contacted to help. No action is needed right now.

Sample values:
contact_name = Priya Sharma
owner_name = Rohan Mehta

Footer: None
Buttons: None
