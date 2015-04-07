/* 
name: trackClients.c
author: jennifer hsu
date: spring 2012
desc: object to keep track of clients in springfest 2015 synthesizer code with Chris with a maximum of 10 unique clients

   possible inputs:
      messages:
         'add _client_id_': adds _client_id_ to internal list of clients and assigns _client_id_ to an index [0-9]
	 'remove _client_id': removes _client_id_ to internal list of clients, clears the associated index
	 'dump': outputs all client id and ind pairs
	 'clear': clears all client ids 
      float: 
         '_client_id_': outputs the index associated with _client_id_
   all inputs output to the left outlet (the only outlet)
*/

#include "m_pd.h"

#define MAX_CLIENTS 10
 
typedef struct trackClients
{
  t_object x_ob;
  t_outlet *x_outlet;
  t_float clientList[MAX_CLIENTS];
} t_trackClients;

void trackClients_float(t_trackClients *x, t_floatarg f)
{
  int i;
  int found = 0;
  for(i = 0; i < MAX_CLIENTS; i++)
  {
    if(x->clientList[i] == f)
    {
      outlet_float(x->x_outlet, i);
      found = 1;
      break;
    } 
  }
  if(found == 0)
  {
    post("trackClients: client %f was not found in the client list", f);
  } else
  { 
    post("trackClients: yay! the index is %d", i);
  }
}

void trackClients_add(t_trackClients *x, t_symbol *selector, int argcount, t_atom *argvec)
{

    if(argcount == 1)
    {
      if(argvec[0].a_type == A_FLOAT)
	{
	  int i;
	  int addFlag = 0;
	  int inlist = 0;
	  // first check that this client isn't already in our list
	  for(i = 0; i < MAX_CLIENTS; i++)
	  {
	    if(x->clientList[i] ==  argvec[0].a_w.w_float)
	    {
	      post("trackClients: uh oh, client is already in our list at index %d", i);
	      inlist = 1;
	    }
	  }
	  // add the client to our list
	  if(inlist == 0)
	  {
	    for(i = 0; i < MAX_CLIENTS; i++)
	    {
	      if(x->clientList[i] == -1)
	      {
		x->clientList[i] = argvec[0].a_w.w_float;
		addFlag = 1;
		post("trackClients: added client %f to index %d", argvec[0].a_w.w_float, i);
		break;
	      } else
	      {
		continue;
	      }
	    }


	  // check that the client was added
	    if(addFlag == 0)
	      post("trackClients: client list is full, client %f was not added to the list", argvec[0].a_w.w_float);
	  }
	} else
	{
	  post("trackClients: 'add' must be follwed by a single float");
	}
    } else
    {
      post("trackClients: can only add one client at a time");
    }
}

void trackClients_remove(t_trackClients *x, t_symbol *selector, int argcount, t_atom *argvec)
{
    if(argcount == 1)
    {
      if(argvec[0].a_type == A_FLOAT)
	{
	  int i;
	  int removeFlag = 0;

	  // remove the client from our list
	  for(i = 0; i < MAX_CLIENTS; i++)
	  {
	    if(x->clientList[i] == argvec[0].a_w.w_float)
	    {
	      x->clientList[i] = -1;
	      removeFlag = 1;
	      post("trackClients: removed client %f from index %d", argvec[0].a_w.w_float, i);
	      break;
	    } else
	    {
	      continue;
	    }
	  }

	  // check that the client was removed
	  if(removeFlag == 0)
	    post("trackClients: client %f was not found in client list and was not removed", argvec[0].a_w.w_float);
	  
	} else
	{
	  post("trackClients: 'remove' must be follwed by a single float");
	}
    } else
    {
      post("trackClients: can only remove one client at a time");
    }
}

void trackClients_dump(t_trackClients *x, t_symbol *selector, int argcount, t_atom *argvec)
{
   
  int i;
  for(i = 0; i < MAX_CLIENTS; i++)
    {
      if(x->clientList[i] != -1)
	post("%d: %f", i, x->clientList[i]);
    }
}

void trackClients_clear(t_trackClients *x, t_symbol *selector, int argcount, t_atom *argvec)
{
   
  int i;
  for(i = 0; i < MAX_CLIENTS; i++)
    {
      if(x->clientList[i] != -1)
	x->clientList[i] = -1;
    }
}



t_class *trackClients_class;

void *trackClients_new(t_symbol *selector, int argcount, t_atom *argvec)
{
    t_trackClients *x = (t_trackClients *)pd_new(trackClients_class);
    x->x_outlet = outlet_new(&x->x_ob, gensym("float"));

    int i;
    for(i = 0; i < MAX_CLIENTS; i++)
    {
      x->clientList[i] = -1;
    }

    return (void *)x;
}

void trackClients_setup(void)
{
    	/* We specify "A_GIMME" as creation argument for both the creation
	routine and the method (callback) for the "rats" message.  */
    trackClients_class = class_new(gensym("trackClients"), (t_newmethod)trackClients_new,
    	0, sizeof(t_trackClients), 0, A_GIMME, 0);
    class_addfloat(trackClients_class, trackClients_float);
    class_addmethod(trackClients_class, (t_method)trackClients_add, gensym("add"), A_GIMME, 0);
    class_addmethod(trackClients_class, (t_method)trackClients_remove, gensym("remove"), A_GIMME, 0);
    class_addmethod(trackClients_class, (t_method)trackClients_dump, gensym("dump"), A_GIMME, 0);
    class_addmethod(trackClients_class, (t_method)trackClients_clear, gensym("clear"), A_GIMME, 0);
}

