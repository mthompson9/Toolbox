from __future__ import division
from django.shortcuts import render
from django.http import HttpResponse
from flask import Flask, request, render_template
from firebase import firebase
import json
import requests
import os
import os.path
import time
from google.cloud import storage
import numpy as np
from scipy.interpolate import pchip_interpolate as interp1
from scipy import sparse
from scipy.sparse.linalg import spsolve
import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
import matplotlib
import math
from datetime import datetime


firebase = firebase.FirebaseApplication('https://bio-sim.firebaseio.com/')

app = Flask(__name__)


#@csrf_exempt
#@api_view(['POST'])
@app.route('/', methods=['GET', 'POST'])
def index(request):
    with app.app_context(): 
        data = request.body
        print("Gave us" + str(data))
        pyFbPath = str(data)[2:]
        #truePath = str(pyFbPath)[:-1]
        truePath = str(data)
        print("Then got " + truePath)
        pathLink = ('/Current Simulation/' + str(truePath) + '/')
        print("Example path" + pathLink)
        pathDink = (str(pathLink) + 'Spray/')
        print("Oi " + pathDink)
        hLoad = "Calculating"
        lo1 = "Unused"
        lo2 = "Unused"
        lo3 = "Unused"
        sendLoad = {'0':hLoad, '1':data, '2':hLoad, '3':hLoad, '4':hLoad, '5':hLoad}
        firebase.patch('/Current Simulation/currentSim/output/col1', {"0": hLoad, "1": hLoad, "2": hLoad, "3": hLoad, "4": hLoad, '5': hLoad})
        #firebase.patch('/Current Simulation/currentSim/output', {"col1": sendLoad})
        firebase.patch('/Current Simulation/currentSim/output/', {"col2": sendLoad})
        firebase.patch('/Current Simulation/currentSim/output/', {"col3": sendLoad})
        firebase.patch('/Current Simulation/currentSim/output/', {"col4": sendLoad})
        applicationRate = firebase.get(pathLink + 'Spray/', 'ApplicationRate')
        molarMass = firebase.get(pathLink + 'AI/', 'MolarMass')
        #waterSolubility = firebase.get(pathLink + 'AI/', 'SolubilityInWater')
        diffCoCuticle = firebase.get(pathLink + 'Leaf_Properti/es/', 'coefficientCuticular')
        sprayVol = firebase.get(pathLink + 'Spray/', 'DilutionRate')
        tpone = firebase.get(pathLink + 'Time_Points/1/', 'Hours')
        tptwo = firebase.get(pathLink + 'Time_Points/1', 'Minutes')
        tpthree = firebase.get(pathLink + 'Time_Points/1/', 'Seconds')
        print("yey" + tpone)
        print("yey" + tptwo)
        print("yey" + tpthree)
        print("yey" + applicationRate)
        print("Molar Mass = " + str(molarMass))
        startTime = datetime.now()
        minute = 1/(24*60)
        die = 24*60
        tstart = 0

        # INPUT FOR NUMERICAL SCHEME %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
        # select numerical scheme:
        # finite_volumes
        # finite_differences
        NUMERICAL_SCHEME = 'finite_volumes'

        # select boundary conditions:
        # constant: C(x=0,L)=C00,C0L
        # noflux: dC/dx|x=0,L = 0
        BOUNDARY_CONDITIONS_WEST='constant'
        BOUNDARY_CONDITIONS_EAST='constant'

        # select between homogenous and inhomogeneous mesh
        xmesh='inhomogeneous'

        NT0=1*125 #%tot number of time steps per minute
        dt0=5  #%[min]-uptake saved every dt0 minutes
        dt2=10 #%[min]-profiles saved every dt0 minutes

        #% initialise simulation
        AI='PXD' #%select AI

        # select type of simulation:
        #% convergence: studies dynamics convergence of uptake for fixed parameters
        #% targetuptake: finds DCUTICLE to satisfy requirement on uptake
        #% dynamics: simulate dynamics for fixed parameters
        #% riskfactor: evaluate loss factor importance
        SIMULATOR='dynamics'

        #% identify test number
        test_number=[1]

        # global system parameters %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
        #C_TISSUE can be empty
        C_TISSUE_SATURATION=3.2 #%3.2[g/L] % saturation level of leaf tissue (can leave empty)

        #This is the solubility in water variable. The default value is 380
        CSACID=380  #[g/L] solubility of dione herbicide in water, pH=7.4 => 380#
                                #[g/L] solubility of dione herbicide in water, pH=5.0 => 5.2#
                                #%[g/L] solubility of procide in water => 0.2#


        #% specific parameters %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

        #This is the diffusion coefficient in the cuticular layer, default val of 4.3449e-14
        D_CUTICLE=4.3449e-14  #D in cuticle layer [m^2/s]
        TOTAL_TIME=360 #[min] total propagation time
        STEPCHANGE_TIME=0 #%[min] % time at which DCUTICLE is reduced
        DCUT_REDUCTION=1 #%reduction factor of cuticle D

        #VTOT default is 200
        #MW default is 400.51
        #MTOT default is 50


        #% initial conditions
        VTOT=applicationRate# %[L] total amount of solution sprayed over 1ha
        MTOT=sprayVol# %[g] total AI mass sprayed over 1 ha
        CSP=MTOT/VTOT#% [g/L]  initial concentration of AI per L sprayed
        AL=0.1# % fraction of hectar covered by weed target
        MW=molarMass#%[g/mol] PXD molar weight
        TC=25# %Temperature [oC]

        #% values for the diffusion coefficients:
        # Diffusion Coefficient in cuticular layer, default of 1e-12
        D_DEPOSIT=1e-12#    %D of deposited layer [m^2/s]
        D_LEAFTISSUE=1e-9# %D in leaf tissue [m^2/s] %1e-11

        #% leaf width parameters (x-window parameters)
        L_DEPOSIT=28e-6#%[m] thickness of deposit layer
        L_CUTICLE=4*1e-6#%[m] real thickness of cuticle layer
        L_LEAFTISSUE=1e-3+20e-6# %[m] thickness of leaf tissue

        #% Temperature
        T=TC+273.15# %Kelvin


        # Loss rates:

        # photostability
        Kgamma0=(7.53784e-5)*60# %[1/min] photostability loss rate compatible with Axial EC100
        #print("Kgamma0", Kgamma0)


        # chemical stability (degradation catalysed by presence of electrolytes Na+ and K+):
        # Salt correction:
        Nasaltcorrection=49
        Ksaltcorrection=39
        # Catalyst concentrations for chemical loss:
        Nappm=4.6# %ppm
        Kppm=0# %ppm
        #KNa= exp(10.5-6558/T)/60/Nasaltcorrection*Nappm# %mol/(L min)
        KK = 0#%exp(9.7-6490/T)/60/Ksaltcorrection*Kppm#  %mol/(L min)
        #%Kchem0=(KNa+KK)*MW*VTOT*AL#  %mol/(L min)*(g/mol)*(L/m^2)=g/(min m^2)
        csNa=0.00003*TC**2-0.045*TC**2+1.41*T+67.5# %solubility of cation [ppm]
        #print("csNa", csNa)
        KNa=np.exp(10.8-8000/T)*csNa*23/60# %[g/(L min)]
        #print("KNa", KNa)
        Kchem0=10000*KNa

        # metabolism of acid inside leaf
        Kmet0=1*(.003/2) #;%[0.005 0.01 0.02 0.03];%0.003;%[1/min]
        #print("Kmet0", Kmet0)
        study = None

        if STEPCHANGE_TIME == 0:
            tfinal = TOTAL_TIME
        else:
            tfinal = STEPCHANGE_TIME

        textension = TOTAL_TIME-tfinal;

        #Time vector
        nt = NT0*TOTAL_TIME #total number of time steps
        nt1 = round(STEPCHANGE_TIME/TOTAL_TIME*nt)
        #print("nt1 ", nt1)
        ntext = nt-nt1

        #discretise time / min
        dt = TOTAL_TIME/nt
        #print("dt ", dt)
        maxk = np.fix(tfinal/dt)
        #print("maxk ", maxk)
        t = np.arange(tstart, tfinal, dt)

        maxkext = np.fix(textension/dt)
        #print("maxkext ", maxkext)
        if tfinal == TOTAL_TIME:
            textn = [tfinal]
        else:
            textn = np.arange(tfinal, TOTAL_TIME, dt)
        ttot = np.concatenate((t, textn))
        #print("ttot ", ttot)
        L_ISOLATION = 100.8E-6 #thickness of intial vacuum
        L_ISO1=40e-6;#[m] considered thickness of initial vacuum
        L_ISO2=20e-6;#[m] considered thickness of end vacuum
        L_01=L_ISOLATION-L_ISO1
        L_02=L_ISOLATION-L_ISO2

        # calculate effective/real intermediate positions
        L_air0=L_ISOLATION #[m] width of isolation zone
        L_out0=L_air0+L_DEPOSIT #[m] start position of cuticle layer
        L_cut0=L_out0+L_CUTICLE #[m] end position of cuticle layer
        L_leaf0=L_cut0+L_LEAFTISSUE #[m] end position of leaf (abaxial surface)
        L_TOT0=L_ISOLATION+L_DEPOSIT+L_CUTICLE+L_LEAFTISSUE+L_ISOLATION #[m] total width of x-window
        #print("L_TOT0", L_TOT0)

        #renormalisation:
        XF=100 #total normalised length
        alfa=L_TOT0/XF

        #renormalise diffusion coefficient in outer deposit
        DVAC0=D_DEPOSIT*60/alfa**2 #[m^2/min]
        DCUT0=D_CUTICLE*60/alfa**2 #rescaled
        DLEAF0=D_LEAFTISSUE*60/alfa**2 #rescaled
        #print("DVAC0 ", DVAC0)
        #print("DCUT0 ", DCUT0)
        #print("DLEAF0 ", DLEAF0)

        #leaf regions normalized wrt L_TOTAL=XF (alfa=L_TOT0/XF;)
        L_air=L_air0/alfa #start of deposited layer
        L_out=L_out0/alfa #leaf adaxial surface position
        L_cut=L_cut0/alfa #end of cuticle wax layer
        L_leaf=L_leaf0/alfa #end of leaf

        #print("L_air ", L_air)
        #print("L_out ", L_out)
        #print("L_cut ", L_cut)
        #print("L_leaf ", L_leaf)

        if NUMERICAL_SCHEME == "finite_volumes":
            nx0 = 5 #12*2^(5); %number of points needed in critical layer
        else:
            nx0 = 80 #number of points needed in critical layer

        #print("nx0 ", nx0)
        blayer=400e-9   #thickness of boundary layer
        LCRITICAL=blayer #blayer or L_CUTICLE(irun)

        #allocations
        #iksaving=dt0*NT0;% time interval at which to save intermediate data
        #iksaving2=dt2*NT0;% time interval at which to save intermediate data
        #nksaving=ceil(nt/iksaving);
        #ikdisp=5e3; %time at which to display flag

        #LTUP= np.zeros  zeros(nksaving,1); %uptake leaf tissue old
        #LWUP=zeros(nksaving,1); %uptake leaf wash
        #CUTUP=zeros(nksaving,1);%uptake cuticle
        #timev=zeros(nksaving,1);%saving time points

        ####CALL DIFFUSION_XMESH_LEAFMODEL####

        # Discretise space
        # Build x coordinate mesh
        # both homogeneous (x) and inhomogeneous (xdis) mesh
        # normalisation: x= x[m]/alfa
        # output
        # x, nx+1: homogenous mesh [normalised]
        # xdis, nxdis: inhomogenous mesh [normalised]

        # build dense homogenous auxiliary spatial grid
        # required critical dx:
        dx= LCRITICAL/alfa/nx0  #normalised dx
        #print("dx ", dx)
        x=np.arange(0, XF, dx)
        #print("x ", x)
        dxc=dx
        #print("dxc ", dxc)
        nx=len(x)-1
        #print("nx ", nx)

        #build inhomogeneous grid
        db1=blayer/alfa
        db2=db1
        db3=db1
        db4=db1
        db6=db1
        db7=db1
        db8=db1

        d1=L_air-db1
        d2=L_air+db2
        d3=L_out-db3
        d2b=(d2+d3)/2
        d4=L_out+db4
        d6=L_cut+db6
        d7=L_leaf-db7
        d6b=(d6+d7)/2
        d8=L_leaf+db8

        #print("d1 ", d1)
        #print("d2 ", d2)
        #print("d3 ", d3)
        #print("d2b ", d2b)
        #print("d4 ", d4)
        #print("d6 ", d6)
        #print("d7 ", d7)
        #print("d6b ", d6b)
        #print("d8 ", d8)

        L1=d1
        L2=d2b-d2
        L3=d3-d2b
        L6=d6b-d6
        L7=d7-d6b
        L8=XF-d8

        aa=1.05
        n1=np.floor(np.log(1-L1*(1-aa)/dxc/aa)/np.log(aa))
        #print("n1 ", n1)
        ve1=np.arange(1,n1+1,1)
        #print("vel ", ve1)
        dx1=aa**ve1*dxc
        #print("dx1 ", dx1)
        x1=np.zeros(int(n1))
        #print("x1 ", x1)

        for ii in np.arange(0,n1,dtype=int):
            x1[ii] = d1-np.sum(dx1[0:ii+1])

        x1 = x1[::-1]

        x2 = np.arange(x1[-1]+dxc, d2, dxc)
        #print("x2 ", x2)
        n3 = np.floor(np.log(1-L2*(1-aa)/dxc/aa)/np.log(aa))
        #print("n3 ", n3)
        ve3 = np.arange(1,n3+1,1, dtype=int)
        #print("ve3 ", ve3)
        dx3 = aa**ve3*dxc
        #print("dx3 ", dx3)
        x3 = np.zeros(int(n3))

        for ii in np.arange(0,n3,dtype=int):
            x3[ii] = d2+np.sum(dx3[0:ii+1])
        #print("x3 ", x3)
        dx4 = dx3[::-1]
        #print("dx4 ", dx4)
        x4 = np.zeros(int(n3))

        for ii in np.arange(0,n3,dtype=int):
            x4[ii] = x3[-1]+np.sum(dx4[0:ii+1])
        #print("x4 ", x4)
        x5 = np.arange(x4[-1]+dxc, d6, dxc)
        #print("x5 ", x5)
        n6 = np.floor(np.log(1-L6*(1-aa)/dxc/aa)/np.log(aa))
        #print("n6 ", n6)
        ve6 = np.arange(1,n6+1,1, dtype=int)
        #print("ve6 ", ve6)
        dx6 = aa**ve6*dxc
        #print("dx6 ", dx6)
        x6 = np.zeros(int(n6))
        for ii in np.arange(0,n6,dtype=int):
            x6[ii] = d6+np.sum(dx6[0:ii+1])
        #print("x6 ", x6)
        dx7 = dx6[::-1]
        #print("dx7 ", dx7)
        x7 = np.zeros(int(n6))
        for ii in np.arange(0,n6,dtype=int):
            x7[ii] = x6[-1]+np.sum(dx7[0:ii+1])
        #print("x7 ", x7)
        x8 = np.arange(x7[-1]+dxc, d8, dxc)
        #print("x8 ", x8)
        n9 = np.floor(np.log(1-L8*(1-aa)/dxc/aa)/np.log(aa))
        #print("n9 ", n9)
        ve9 = np.arange(1,n9+1,1, dtype=int)
        dx9 = aa**ve9*dxc
        #print("dx9 ", dx9)
        x9 = np.zeros(int(n9))
        for ii in np.arange(0,n9,dtype=int):
            x9[ii] = x8[-1]+np.sum(dx9[0:ii+1])

        xdis = np.concatenate((x1, x2))
        xdis = np.concatenate((xdis, x3))
        xdis = np.concatenate((xdis, x4))
        xdis = np.concatenate((xdis, x5))
        xdis = np.concatenate((xdis, x6))
        xdis = np.concatenate((xdis, x7))
        xdis = np.concatenate((xdis, x8))
        xdis = np.concatenate((xdis, x9))

        nxdis = len(xdis)

        #rearrange auxiliary full spatial grid to cover exactly the inhomogenous one
        xf=xdis[-1]
        #print("xf ", xf)
        x0=xdis[0]
        #print("x0 ", x0)
        x=np.linspace(x0,xf,num=nx+1)
        #x = np.arange(0, xf, dx)
        #print("x ", len(x))


        ####END DIFFUSION_XMESH_LEAFMODEL

        ###Call DIFFUSION_DCOEFFICENT_LEAFMODEL
        deltax = 1.976E-6 / alfa #transition deposit-cuticle ORIGINAL=20*dx	  deltax0=20; deltax=deltax0*dx;
        #print("deltax", deltax)
        deltax2 = 7.8125E-6/alfa #transition cuticle-tissue  ORIGINAL=1000*dx	  deltax20=750;deltax2=deltax20*dx;
        #print("deltax2", deltax2)

        y11 = [0, L_air]
        #print("y11", y11)
        D11 = [0 for i in range(len(y11))]
        #print("D11", D11)
        y22 = [L_air+deltax, L_out-deltax]
        #print("y22", y22)
        D22 = [DVAC0 for i in range(len(y22))]
        #print("D22", D22)
        y33 = [L_out, L_cut]
        #print("y33", y33)
        D33 = [DCUT0 for i in range(len(y33))]
        #print("D33", D33)
        y44 = [L_cut+deltax2, L_leaf-deltax2]
        #print("y44", y44)
        D44 = [DLEAF0 for i in range(len(y44))]
        #print("D44", D44)
        y55 = [L_leaf, x[-1]]
        #print("y55", y55)
        D55 = [0 for i in range(len(y55))]
        #print("D55", D55)
        yy = y11 + y22 + y33 + y44 + y55
        #print("yy", yy)
        DD = D11 + D22 + D33 + D44 + D55
        D = interp1(yy, DD, x)
        #nd = len(D)
        #print("nd", nd)

        # build DA (stop diffusion in deposit when TISSUE saturated)
        y11 = [0, L_air]
        #print("y11", y11)
        D11 = [0 for i in range(len(y11))]
        #print("D11", D11)
        y22 = [L_air+deltax, L_out-deltax]
        #print("y22", y22)
        D22 = [DVAC0 for i in range(len(y22))]
        #print("D22", D22)
        y33 = [L_out, L_cut]
        #print("y33", y33)
        D33 = [DCUT0/DCUT_REDUCTION for i in range(len(y33))]
        #print("D33", D33)
        y44 = [L_cut+deltax2, L_leaf-deltax2]
        #print("y44", y44)
        D44 = [DLEAF0*1E-6 for i in range(len(y44))]
        #print("D44", D44)
        y55 = [L_leaf, x[-1]]
        #print("y55", y55)
        D55 = [0 for i in range(len(y55))]
        #print("D55", D55)
        yy = y11 + y22 + y33 + y44 + y55
        #print("yy", yy)
        DD = D11 + D22 + D33 + D44 + D55
        DA = interp1(yy, DD, x)

        ###END DIFFUSION_DCOEFFICENT_LEAFMODEL



        ####CALL DIFFUSION_CONCENTRATIONPROFILE
        print("Define initial concentration profile in foliar deposit")
        x10 = L_air+(L_out-L_air)/2
        print("x10 ", x10)
        m1 = 400 #supergaussian index in deposit
        epsi = 1E-3
        m11 = 40
        d1 = (L_air-x10)/(-2*np.log(epsi))**(1/m11)
        print("d1 ", d1)
        u0 = np.zeros(nx)
        #print("u0 ", u0)
        u00 = u0[0]
        u0L = u0[-1]
        sgu = 40
        uw = (L_out-L_air)/2.1
        #print("uw ", uw)
        x0 = L_air+uw
        ###overflow issues

        #for index, i in enumerate(x):
        #    a = CSP*1E3*np.exp(-(i-x10)**m1/(2*d1**m1))
        #    print(a)
        #    if np.isinf(a):
        #        print(a)
        #        print(index)


        u0 = (CSP*1E3*np.exp(-(x-x10)**m1/(2*d1**m1))).T
        YM = max(u0)
        #print("YM ", YM)
        u0int = u0[1:nx]
        #print("len u0int", len(u0int))
        u0tissue = np.zeros(len(u0int))
        CSP0 = CSP*1E3

        ####END DIFFUSION_CONCENTRATION PROFILE



        cut_ind2 = np.argmin(abs(x-L_out))
        #print("cut_ind2", cut_ind2)
        int_ind2 = np.argmin(abs(x-L_cut))
        #print("int_ind2", int_ind2)
        leaf_ind2 = np.argmin(abs(x-L_leaf))
        #print("leaf_ind2", leaf_ind2)

        #Build loss rate constants (temporary-homogeneous dense mesh)
        #1st order (photostability-metabolism)
        Kgamma = np.zeros(nx+1)
        #print("length kgamma", len(Kgamma))
        Kgamma[0:cut_ind2] = Kgamma0
        #print("kgamma", Kgamma)
        Kgamma[int_ind2:leaf_ind2] = Kmet0

        #0th order chemical stability
        Kchem = np.zeros(nx+1)
        Kchem[0:cut_ind2] = Kchem0
        #print("Kchem ", Kchem)

        if xmesh == "homogeneous":
            print("homo")
            xdis=x
        elif xmesh == "inhomogeneous":
            print("inhomogenous")
            D = interp1(x, D, xdis)
            u0 = interp1(x, u0, xdis)
            DA = interp1(x, DA, xdis)
            Kgamma = interp1(x, Kgamma, xdis)
            Kchem = interp1(x, Kchem, xdis)
        #Rename variables for convenience
        D0 = D[0]
        DF = D[-1]

        x = xdis
        #print("x ", x)
        nx = len(x)-1
        #print("nx ", nx)
        dx = np.diff(x, n=1, axis=0)
        #print("dx ", dx)
        xint = x[1:nx]
        #print("xint", xint)
        #print("length xint", len(xint))
        dxint = np.diff(xint, n=1, axis=0)
        #print("dxint ", dxint)
        #input()
        #print("len dxint", len(dxint))
        nint = len(xint)

        #build staggered half step grid
        xp = x[0:-1]+dx/2 #nx elements
        #print("xp ", xp)
        #print("len xp", len(xp))
        dxp = np.diff(xp)

        xpint = xint[0:-1]+dxint/2
        #print("xpint", xpint)
        dxpint = np.diff(xpint)
        test = dxint[0]+dx[0]
        #print("test ", test)
        dzint = np.concatenate(([dxint[0]+dx[0]], dxint[1:]+dxint[0:-1]))
        dzint = np.concatenate((dzint, [dx[nx-1]+dxint[nx-3]]))

        #interp on half step grid  %nx elements
        u0P = interp1(x,u0,xp)
        u0Pint = u0P
        u0Ptissue = np.zeros(len(u0Pint))
        KP = interp1(x, Kgamma, xp)
        #print("KP ", KP)
        K0 = interp1(x, Kchem, xp)

        #used for finite differences
        Dint = D[1:nx]
        #print("Dint ", len(Dint))
        DAint = DA[1:nx]

        K1int = Kgamma[1:-1]
        #print("len K1int", len(K1int))
        K0int = Kchem[1:-1]


        #volume element
        ii = np.arange(0,nx, 1)
        #print("ii ", ii)
        iip = np.arange(1,nx+1, 1)

        V = x[iip]-x[ii]
        #print("V ", len(V))

        cut_ind2 = np.argmin(abs(x-L_out)) #start cutin layer
        #print("cut_ind2", cut_ind2)
        int_ind2 = np.argmin(abs(x-L_cut)) #end cutin layer
        #print("int_ind2", int_ind2)
        leaf_ind2 = np.argmin(abs(x-L_leaf)) #end leaf tissue
        #print("leaf_ind2", leaf_ind2)
        nxtissue = int_ind2+1 #start leaf tissue

        Dmax = np.max(D)*alfa**2/60
        #print("Dmax ", Dmax)

        t1 = 0
        ikcount=0
        ikcount2=0


        ####END BDS_SIMULATOR_DYNAMICS
        ####CALL BDS_SIMULATOR_DYNAMICS_FV_MAIN
        ####OR
        ####CALL BDS_SIMULATOR_DYNAMICS_FD_MAIN


        #if NUMERICAL_SCHEME == "finite_volumes":
        print("finite_volumes")
        ##CALL BDS_SIMULATOR_DYNAMICS_FV_MAIN
        #indices for matrix construction
        ii = np.arange(0,nx,1)
        iip = np.arange(1,nx+1, 1)
        ii3 = np.arange(2,nx+1, 1)
        iim = np.arange(1, nx-1, 1)
        ii1 = np.arange(0, nx-2, 1)
        ii2 = np.arange(1, nx, 1)
        ii4 = np.arange(0, nx-1, 1)
        ii33 = np.arange(2, nx, 1)
        ib = np.arange(1, nx-2, 1)
        #print("ib ", ib)
        # use functions defined on staggered half step grid
        u0int = u0Pint
        u0tissue = u0Ptissue


        #matrix allocation and generation
        #build matrices for dynamics
        #output:
        #AP (nx x nx)
        #A (nx x nx)
        #% Q (nx x 1)

        ######Call Diffusion_MATRICES_CN_FV
        #Q = np.zeros(nx)
        Q = -K0*dt
        #print("Q ", Q)

        #AP = np.zeros((nx,nx))
        APDIAG = np.zeros(nx)
        APUP = np.zeros(nx)
        APDOWN = APUP

        ADIAG = np.zeros(nx)
        #AUP = APUP
        APDIAG2 = np.zeros(nx)
        APUP2 = np.zeros(nx)

        ADIAG2 = np.zeros(nx)
        AUP2 = APUP2

        APDIAG[1:nx-1] = 1+dt/2/V[iim]*(D[ii33]/dxp[iim]+D[iim]/dxp[ii1])+KP[iim]*dt/2
        #print("APDIAG ", APDIAG)
        #APUP = np.concatenate(([0], -dt/2/V[ii4]*D[ii2]/dxp))
        APUP =  -dt/2/V[ii4]*D[ii2]/dxp
        #print("APUP ", APUP)
        #APDOWN = np.concatenate((-dt/2/V[ii2]*D[ii2]/dxp, [0]))
        APDOWN = -dt/2/V[ii2]*D[ii2]/dxp
        #print("APDOWN ", APDOWN)

        ADIAG[1:nx-1] = 1-dt/2/V[iim]*(D[ii33]/dxp[iim]+D[iim]/dxp[ii1])-KP[iim]*dt/2
        #print("ADIAG ", ADIAG)
        #AUP = np.concatenate(([0], dt/2/V[ii4]*D[ii2]/dxp))
        AUP = dt/2/V[ii4]*D[ii2]/dxp
        #print("AUP ", AUP)
        #ADOWN = np.concatenate((dt/2/V[ii2]*D[ii2]/dxp, [0]))
        ADOWN = dt/2/V[ii2]*D[ii2]/dxp
        #print("ADOWN ", ADOWN)

        if (BOUNDARY_CONDITIONS_WEST == "constant"):
            APDIAG[0] = 1+dt/2/V[0]*(D[1]/dxp[0]+D[0]/(dxp[0]/2))+KP[0]*dt/2
            Q[0] = Q[0]+dt*u0[0]*D[0]/dx[0]/(dxp[0]/2)
            ADIAG[0] = 1-dt/2/V[0]*(D[1]/dxp[0]+D[0]/(dxp[0]/2))-KP[0]*dt/2
        elif BOUNDARY_CONDITIONS_WEST == "noflux":
            APDIAG[0] = 1+dt/2/V[0]*(D[1]/dxp[0])+KP[0]*dt/2
            ADIAG[0] = 1-dt/2/V[0]*(D[1]/dxp[0])-KP[0]*dt/2

        if (BOUNDARY_CONDITIONS_EAST == "constant"):
            APDIAG[nx-1]=1+dt/2./V[nx-1]*(DF/(dxp[nx-2]/2)+D[nx-1]/dxp[nx-2])+KP[nx-1]*dt/2
            ADIAG[nx-1]=1-dt/2/V[nx-1]*(DF/(dxp[nx-2]/2)+D[nx-1]/dxp[nx-2])-KP[nx-1]*dt/2
            Q[nx-1]=Q[nx-1]+dt*u0L*D[nx]/dx[nx-1]/(dxp[nx-2]/2)
        elif (BOUNDARY_CONDITIONS_EAST == "noflux"):
            APDIAG[nx-1] = 1+dt/2/V[nx-1]*(D[nx-1]/dxp[nx-2])+KP[nx-1]*dt/2
            ADIAG[nx-1] = 1-dt/2/V[nx-1]*(D[nx-1]/dxp[nx-2])-KP[nx-1]*dt/2


        AP = sparse.csc_matrix(sparse.diags([APDOWN, APDIAG, APUP], [-1,0,1]))
        A = sparse.csc_matrix(sparse.diags([ADOWN, ADIAG, AUP], [-1,0,1]))

        #saturated leaf tissue dynamics
        APDIAG2[1:nx-1] = 1+dt/2/V[iim]*(DA[ii33]/dxp[iim]+DA[iim]/dxp[ii1])+KP[iim]*dt/2
        #print("APDIAG2 ", APDIAG2)
        APUP2 =  -dt/2/V[ii4]*DA[ii2]/dxp
        #print("APUP ", APUP)
        APDOWN2 = -dt/2/V[ii2]*DA[ii2]/dxp
        #print("APDOWN ", APDOWN)

        ADIAG2[1:nx-1] = 1-dt/2/V[iim]*(DA[ii33]/dxp[iim]+DA[iim]/dxp[ii1])-KP[iim]*dt/2
        #print("ADIAG ", ADIAG)
        AUP2 = dt/2/V[ii4]*DA[ii2]/dxp
        #print("AUP ", AUP)
        ADOWN2 = dt/2/V[ii2]*DA[ii2]/dxp

        if (BOUNDARY_CONDITIONS_WEST == "constant"):
            APDIAG2[0] = 1+dt/2/V[0]*(DA[1]/dxp[0]+DA[0]/(dxp[0]/2))+KP[0]*dt/2
            ADIAG2[0] = 1-dt/2/V[0]*(DA[1]/dxp[0]+DA[0]/(dxp[0]/2))-KP[0]*dt/2
        elif BOUNDARY_CONDITIONS_WEST == "noflux":
            APDIAG2[0] = 1+dt/2/V[0]*(DA[1]/dxp[0])+KP[0]*dt/2
            ADIAG2[0] = 1-dt/2/V[0]*(DA[1]/dxp[0])-KP[0]*dt/2

        if (BOUNDARY_CONDITIONS_EAST == "constant"):
            APDIAG2[nx-1]=1+dt/2./V[nx-1]*(DF/(dxp[nx-2]/2)+DA[nx-1]/dxp[nx-2])+KP[nx-1]*dt/2
            ADIAG2[nx-1]=1-dt/2/V[nx-1]*(DF/(dxp[nx-2]/2)+DA[nx-1]/dxp[nx-2])-KP[nx-1]*dt/2
        elif (BOUNDARY_CONDITIONS_EAST == "noflux"):
            APDIAG2[nx-1] = 1+dt/2/V[nx-1]*(DA[nx-1]/dxp[nx-2])+KP[nx-1]*dt/2
            ADIAG2[nx-1] = 1-dt/2/V[nx-1]*(DA[nx-1]/dxp[nx-2])-KP[nx-1]*dt/2

        AP2 = sparse.csc_matrix(sparse.diags([APDOWN2, APDIAG2, APUP2], [-1,0,1]))
        A2 = sparse.csc_matrix(sparse.diags([ADOWN2, ADIAG2, AUP2], [-1,0,1]))

        #Acid dynamics
        metabolic_dynamics = (1-Kmet0*dt/2)/(1+Kmet0*dt/2)
        #print("metabolic dynamics ", metabolic_dynamics)

        #Pure loss dynamics
        loss_dynamics=(1-dt/2*KP)/(1+dt/2*KP);
        #print("loss dynamics ", loss_dynamics)
        loss_dynamics0=-K0*dt/(1+dt/2*KP);

        ###END DIFFUSION_MATRICES_CN_FV

        print("Start time loop")
        u0init = u0int

        if C_TISSUE_SATURATION>0:
            tissuesaturation = C_TISSUE_SATURATION*L_LEAFTISSUE/alfa
        else:
            tissuesaturation=np.inf



        #Compute time dynamics
        #Edit this value to change number of iterations
        #Default is ikmax = maxk
        ikmax = int(tpthree)
        ikmaxquart = int(round(ikmax/4))
        ikmaxhalf = int(round(ikmax/2))
        ikmaxthreequart = int(round((ikmax/4)*3))

        #####CALL DIFFUSION_DYNAMICS_CN
        print("Passed if/else")
        if NUMERICAL_SCHEME == "finite_volumes":
            dxaux = dx
        elif NUMERICAL_SCHEME == "finite_differences":
            if xmesh == "homogeneous":
                dxaux = np.concatenate((dxint, dx(nx)))
            elif xmesh == "inhomogeneous":
                dxaux = np.concatenate((dxint[0], dxint))
                #Q=Q.T
                print("Finite differences inhomogeneous mesh NOT READY")
        #Default is ar = np.size(dxaux)
        #Default is br = np.size(u0tissue)
        ar = np.size(dxaux)
        br = np.size(u0tissue)
        print("ar ", ar)
        print("br ", br)
        ikdisp = 5000
        print(ikmax)
        uplt = []
        uplw = []
        upcut = []
        upltlw = []
        #upltcut = []
        upltlwcut = []
        uplt_loss = []
        uplw_loss = []
        upcut_loss = []
        timev = []

        for ik in range(int(ikmax)):
            if ik%ikdisp == 0:
                print("Iteration {0}/{1}".format(ik, ikmax))

            if np.sum(u0tissue*dxaux) > tissuesaturation:
                u0int = spsolve(AP2, A2*u0int+Q, use_umfpack=False)
            else:
                u0int = spsolve(AP, A*u0int+Q, use_umfpack=False)
            for i in AP:
                print(i)
            print(AP)

            print("u0int", max(u0int))
            #input()
            u0int[u0int<0]=0

            t1 = t1+dt
            u0tissue[nxtissue-1:] = u0tissue[nxtissue-1:]+u0int[nxtissue-1:]
            u0int[nxtissue-1:]=0
            u0tissue=metabolic_dynamics*u0tissue



            plots = 1
            if  1%1 == 0:
                ikcount = ikcount+1
                uplt.append(np.sum(u0tissue*dxaux)/np.sum(u0init*dxaux)*100)
                uplt_loss.append(np.sum(u0tissue*dxaux)/np.sum(u0init*dxaux)*100)
                print(np.sum(u0tissue))
                #input()
                uplw.append(100-(np.sum(u0int[0:cut_ind2]*dxaux[0:cut_ind2])/np.sum(u0init*dxaux)*100))
                uplw_loss.append(100-(np.sum(u0int[0:cut_ind2]*dxaux[0:cut_ind2])/np.sum(u0init*dxaux)*100))
                upcut.append(np.sum(u0int[cut_ind2:nxtissue]*dxaux[cut_ind2:nxtissue])/np.sum(u0init*dxaux)*100)
                upcut_loss.append(np.sum(u0int[cut_ind2:nxtissue]*dxaux[cut_ind2:nxtissue])/np.sum(u0init*dxaux)*100)
                upltlw.append((np.sum(u0tissue*dxaux)/np.sum(u0init*dxaux)*100)+(100-(np.sum(u0int[0:cut_ind2]*dxaux[0:cut_ind2])/np.sum(u0init*dxaux)*100)))
                #upltcut.append((np.sum(u0tissue*dxaux)/np.sum(u0init*dxaux)*100) + (np.sum(u0int[cut_ind2:nxtissue]*dxaux[cut_ind2:nxtissue])/np.sum(u0init*dxaux)*100))
                upltlwcut.append((np.sum(u0tissue*dxaux)/np.sum(u0init*dxaux)*100) + (100-(np.sum(u0int[0:cut_ind2]*dxaux[0:cut_ind2])/np.sum(u0init*dxaux)*100)) + (np.sum(u0int[cut_ind2:nxtissue]*dxaux[cut_ind2:nxtissue])/np.sum(u0init*dxaux)*100))
                timev.append(t1)





            #if ik%625==0:
            #    ikcount = ikcount+1
            #    uplt.append(np.sum(u0tissue*dxaux)/np.sum(u0init*dxaux)*100)
            #    uplw.append(np.sum(u0int[0:cut_ind2]*dxaux[0:cut_ind2])/np.sum(u0init*dxaux)*100)
            #    upcut.append(np.sum(u0int[cut_ind2:nxtissue]*dxaux[cut_ind2:nxtissue])/np.sum(u0init*dxaux)*100)
            #    timev.append(t1)

            #END DIFFUSION_DYNAMICS_CN


        if STEPCHANGE_TIME > 0: #Redefine coefficient reduced
            print("Second time phase with reduced DCUTICLE")

            #Build diffusion coefficient now on inhomogeneous grid
            #normalisation D = D/alfa^2*60 [L^2/min]
            #% input: transition layers deposit-cuticle/cuticle-tissue
            #% output
            #% D (size(x)) D for AI [normalised]
            #% DA(size(x)) suppressed diffusion in deposit [normalised]
            DCUT0 = DCUT0/DCUT_REDUCTION
            ###Call DIFFUSION_DCOEFFICENT_LEAFMODEL
            deltax = 1.976E-6 / alfa #transition deposit-cuticle ORIGINAL=20*dx	  deltax0=20; deltax=deltax0*dx;
            #print("deltax", deltax)
            deltax2 = 7.8125E-6/alfa #transition cuticle-tissue  ORIGINAL=1000*dx	  deltax20=750;deltax2=deltax20*dx;
            #print("deltax2", deltax2)

            y11 = [0, L_air]
            #print("y11", y11)
            D11 = [0 for i in range(len(y11))]
            #print("D11", D11)
            y22 = [L_air+deltax, L_out-deltax]
            #print("y22", y22)
            D22 = [DVAC0 for i in range(len(y22))]
            #print("D22", D22)
            y33 = [L_out, L_cut]
            #print("y33", y33)
            D33 = [DCUT0 for i in range(len(y33))]
            #print("D33", D33)
            y44 = [L_cut+deltax2, L_leaf-deltax2]
            #print("y44", y44)
            D44 = [DLEAF0 for i in range(len(y44))]
            #print("D44", D44)
            y55 = [L_leaf, x[-1]]
            #print("y55", y55)
            D55 = [0 for i in range(len(y55))]
            #print("D55", D55)
            yy = y11 + y22 + y33 + y44 + y55
            #print("yy", yy)
            DD = D11 + D22 + D33 + D44 + D55
            D = interp1(yy, DD, x)
            #nd = len(D)
            #print("nd", nd)

            # build DA (stop diffusion in deposit when TISSUE saturated)
            y11 = [0, L_air]
            #print("y11", y11)
            D11 = [0 for i in range(len(y11))]
            #print("D11", D11)
            y22 = [L_air+deltax, L_out-deltax]
            #print("y22", y22)
            D22 = [DVAC0 for i in range(len(y22))]
            #print("D22", D22)
            y33 = [L_out, L_cut]
            #print("y33", y33)
            D33 = [DCUT0/DCUT_REDUCTION for i in range(len(y33))]
            #print("D33", D33)
            y44 = [L_cut+deltax2, L_leaf-deltax2]
            #print("y44", y44)
            D44 = [DLEAF0*1E-6 for i in range(len(y44))]
            #print("D44", D44)
            y55 = [L_leaf, x[-1]]
            #print("y55", y55)
            D55 = [0 for i in range(len(y55))]
            #print("D55", D55)
            yy = y11 + y22 + y33 + y44 + y55
            #print("yy", yy)
            DD = D11 + D22 + D33 + D44 + D55
            DA = interp1(yy, DD, x)

            #% matrix allocation and generation
            #% build matrices for dynamics
            #% output:
            #% AP (nx x nx)
            #% A (nx x nx)
            #% Q (nx x 1)

            #####Call Diffusion_MATRICES_CN_FV
            #Q = np.zeros(nx)
            Q = -K0*dt
            #print("Q ", Q)

            #AP = np.zeros((nx,nx))
            APDIAG = np.zeros(nx)
            APUP = np.zeros(nx)
            APDOWN = APUP

            ADIAG = np.zeros(nx)
            #AUP = APUP
            APDIAG2 = np.zeros(nx)
            APUP2 = np.zeros(nx)

            ADIAG2 = np.zeros(nx)
            AUP2 = APUP2

            APDIAG[1:nx-1] = 1+dt/2/V[iim]*(D[ii33]/dxp[iim]+D[iim]/dxp[ii1])+KP[iim]*dt/2
            #print("APDIAG ", APDIAG)
            #APUP = np.concatenate(([0], -dt/2/V[ii4]*D[ii2]/dxp))
            APUP =  -dt/2/V[ii4]*D[ii2]/dxp
            #print("APUP ", APUP)
            #APDOWN = np.concatenate((-dt/2/V[ii2]*D[ii2]/dxp, [0]))
            APDOWN = -dt/2/V[ii2]*D[ii2]/dxp
            #print("APDOWN ", APDOWN)

            ADIAG[1:nx-1] = 1-dt/2/V[iim]*(D[ii33]/dxp[iim]+D[iim]/dxp[ii1])-KP[iim]*dt/2
            #print("ADIAG ", ADIAG)
            #AUP = np.concatenate(([0], dt/2/V[ii4]*D[ii2]/dxp))
            AUP = dt/2/V[ii4]*D[ii2]/dxp
            #print("AUP ", AUP)
            #ADOWN = np.concatenate((dt/2/V[ii2]*D[ii2]/dxp, [0]))
            ADOWN = dt/2/V[ii2]*D[ii2]/dxp
            #print("ADOWN ", ADOWN)

            if (BOUNDARY_CONDITIONS_WEST == "constant"):
                APDIAG[0] = 1+dt/2/V[0]*(D[1]/dxp[0]+D[0]/(dxp[0]/2))+KP[0]*dt/2
                Q[0] = Q[0]+dt*u0[0]*D[0]/dx[0]/(dxp[0]/2)
                ADIAG[0] = 1-dt/2/V[0]*(D[1]/dxp[0]+D[0]/(dxp[0]/2))-KP[0]*dt/2
            elif BOUNDARY_CONDITIONS_WEST == "noflux":
                APDIAG[0] = 1+dt/2/V[0]*(D[1]/dxp[0])+KP[0]*dt/2
                ADIAG[0] = 1-dt/2/V[0]*(D[1]/dxp[0])-KP[0]*dt/2

            if (BOUNDARY_CONDITIONS_EAST == "constant"):
                APDIAG[nx-1]=1+dt/2./V[nx-1]*(DF/(dxp[nx-2]/2)+D[nx-1]/dxp[nx-2])+KP[nx-1]*dt/2
                ADIAG[nx-1]=1-dt/2/V[nx-1]*(DF/(dxp[nx-2]/2)+D[nx-1]/dxp[nx-2])-KP[nx-1]*dt/2
                Q[nx-1]=Q[nx-1]+dt*u0L*D[nx]/dx[nx-1]/(dxp[nx-2]/2)
            elif (BOUNDARY_CONDITIONS_EAST == "noflux"):
                APDIAG[nx-1] = 1+dt/2/V[nx-1]*(D[nx-1]/dxp[nx-2])+KP[nx-1]*dt/2
                ADIAG[nx-1] = 1-dt/2/V[nx-1]*(D[nx-1]/dxp[nx-2])-KP[nx-1]*dt/2


            AP = sparse.csc_matrix(sparse.diags([APDOWN, APDIAG, APUP], [-1,0,1]))
            A = sparse.csc_matrix(sparse.diags([ADOWN, ADIAG, AUP], [-1,0,1]))

            #saturated leaf tissue dynamics
            APDIAG2[1:nx-1] = 1+dt/2/V[iim]*(DA[ii33]/dxp[iim]+DA[iim]/dxp[ii1])+KP[iim]*dt/2
            #print("APDIAG2 ", APDIAG2)
            APUP2 =  -dt/2/V[ii4]*DA[ii2]/dxp
            #print("APUP ", APUP)
            APDOWN2 = -dt/2/V[ii2]*DA[ii2]/dxp
            #print("APDOWN ", APDOWN)

            ADIAG2[1:nx-1] = 1-dt/2/V[iim]*(DA[ii33]/dxp[iim]+DA[iim]/dxp[ii1])-KP[iim]*dt/2
            #print("ADIAG ", ADIAG)
            AUP2 = dt/2/V[ii4]*DA[ii2]/dxp
            #print("AUP ", AUP)
            ADOWN2 = dt/2/V[ii2]*DA[ii2]/dxp

            if (BOUNDARY_CONDITIONS_WEST == "constant"):
                APDIAG2[0] = 1+dt/2/V[0]*(DA[1]/dxp[0]+DA[0]/(dxp[0]/2))+KP[0]*dt/2
                ADIAG2[0] = 1-dt/2/V[0]*(DA[1]/dxp[0]+DA[0]/(dxp[0]/2))-KP[0]*dt/2
            elif BOUNDARY_CONDITIONS_WEST == "noflux":
                APDIAG2[0] = 1+dt/2/V[0]*(DA[1]/dxp[0])+KP[0]*dt/2
                ADIAG2[0] = 1-dt/2/V[0]*(DA[1]/dxp[0])-KP[0]*dt/2

            if (BOUNDARY_CONDITIONS_EAST == "constant"):
                APDIAG2[nx-1]=1+dt/2./V[nx-1]*(DF/(dxp[nx-2]/2)+DA[nx-1]/dxp[nx-2])+KP[nx-1]*dt/2
                ADIAG2[nx-1]=1-dt/2/V[nx-1]*(DF/(dxp[nx-2]/2)+DA[nx-1]/dxp[nx-2])-KP[nx-1]*dt/2
            elif (BOUNDARY_CONDITIONS_EAST == "noflux"):
                APDIAG2[nx-1] = 1+dt/2/V[nx-1]*(DA[nx-1]/dxp[nx-2])+KP[nx-1]*dt/2
                ADIAG2[nx-1] = 1-dt/2/V[nx-1]*(DA[nx-1]/dxp[nx-2])-KP[nx-1]*dt/2

            AP2 = sparse.csc_matrix(sparse.diags([APDOWN2, APDIAG2, APUP2], [-1,0,1]))
            A2 = sparse.csc_matrix(sparse.diags([ADOWN2, ADIAG2, AUP2], [-1,0,1]))

            #Acid dynamics
            metabolic_dynamics = (1-Kmet0*dt/2)/(1+Kmet0*dt/2)
            #print("metabolic dynamics ", metabolic_dynamics)

            #Pure loss dynamics
            loss_dynamics=(1-dt/2*KP)/(1+dt/2*KP);
            #print("loss dynamics ", loss_dynamics)
            loss_dynamics0=-K0*dt/(1+dt/2*KP);

            ###END DIFFUSION_MATRICES_CN_FV

            #Compute time dynamics
            ikmax = maxkext
            #####CALL DIFFUSION_DYNAMICS_CN
            #print("Passed if/else")
            if NUMERICAL_SCHEME == "finite_volumes":
                dxaux = dx
            elif NUMERICAL_SCHEME == "finite_differences":
                if xmesh == "homogeneous":
                    dxaux = np.concatenate((dxint, dx(nx)))
                elif xmesh == "inhomogeneous":
                    dxaux = np.concatenate((dxint[0], dxint))
                    #Q=Q.T
                    print("Finite differences inhomogeneous mesh NOT READY")

            ar = np.size(dxaux)
            br = np.size(u0tissue)
            #print("ar ", ar)
            #print("br ", br)
            ikdisp = 5000
            print(ikmax)
            uplt = []
            uplw = []
            upcut = []
            timev = []

            for ik in range(int(ikmax)):
                if ik%ikdisp == 0:
                    print("Iteration {0}/{1}".format(ik, ikmax))

                if np.sum(u0tissue*dxaux) > tissuesaturation:
                    u0int = spsolve(AP2, A2*u0int+Q, use_umfpack=False)
                else:
                    u0int = spsolve(AP, A*u0int+Q, use_umfpack=False)

                #print("u0int", max(u0int))
                u0int[u0int<0]=0

                t1 = t1+dt
                u0tissue[nxtissue-1:] = u0tissue[nxtissue-1:]+u0int[nxtissue-1:]
                u0int[nxtissue-1:]=0
                u0tissue=metabolic_dynamics*u0tissue


            #plots = 1
            #if plots == 1:
            #    ikcount = ikcount+1
            #    uplt.append(np.sum(u0tissue*dxaux)/np.sum(u0init*dxaux)*100)
            #    uplw.append(np.sum(u0int[0:cut_ind2]*dxaux[0:cut_ind2])/np.sum(u0init*dxaux)*100)
            #    upcut.append(np.sum(u0int[cut_ind2:nxtissue]*dxaux[cut_ind2:nxtissue])/np.sum(u0init*dxaux)*100)
            #    timev.append(t1)
            #    plt.plot(xp*alfa, u0tissue, 'r')
            #    plt.plot(L_air*alfa, [0], 'k:')

            #END DIFFUSION_DYNAMICS_CN

        i = 0
        cal_loss = np.sum(u0tissue)*10


        #ups = tuple(uplt)
        #ups2 = tuple(uplw)
        #ups3 = tuple(upcut)


        #firebase.patch('/Current Simulation/Current Sim/UpLeaf2/', {uplw: ups2})
        #firebase.patch('/Current Simulation/Current Sim/UpLeafC/', {upcut: ups3})

        client = storage.Client()

        bucket = client.get_bucket('bio-sim.appspot.com')

        timeh = len(timev)
        uplth = len(uplt)
        uplwh = len(uplw)
        upcuth = len(upcut)
        upltlwh = len(upltlw)
        upltlwcuth = len(upltlwcut)

    #upltleg = mpatches.Patch(color='red', label='Leaf Tissue')
    #plt.legend(handles=[upltleg])
        #plt.clf()
        #plt.plot(timev[0: int(round(len(timev)/4))], uplt[0: int(round(len(uplt)/4))])
        #plt.title("Uptake Leaf Tissue")
        ##plt.ylim([0, 100])
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('upltgraph1.png')
        #blob = bucket.blob('upltgraph1.png')
        #blob.upload_from_filename(filename='upltgraph1.png')
        #plt.clf()
        #plt.plot(timev[2:5], uplw[2:5])
        #plt.show()
        #plt.title("Uptake Leaf Width")
        ##plt.ylim([0, 100])
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('uplwgraph1.png')
        #blob = bucket.blob('uplwgraph1.png')
        #blob.upload_from_filename(filename='uplwgraph1.png')
        #plt.clf()
        #plt.plot(timev, upcut)
        #plt.title("Uptake Leaf Cuticle")
        ##plt.ylim([0, 100])
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('upcutgraph1.png')
    #tim#e.sleep(10)
        #blob = bucket.blob('upcutgraph1.png')
        #blob.upload_from_filename(filename='upcutgraph1.png')
        #plt.clf()
        #plt.plot(timev, upltlw)
        ##plt.plot(timev, uplw)
        ##plt.plot(timev, upcut)
        #plt.title("Processes: UPLT, UPLW")
        ##plt.ylim([0, 100])
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('upltlwgraph1.png')
        #blob = bucket.blob('upltlwgraph1.png')
        #blob.upload_from_filename(filename='upltlwgraph1.png')
    #if #(gGen == 5):
        ##plt.clf()
        ##plt.plot(timev, upltcut)
        ##plt.title("Processes: UPLT, UPCUT")
        ##plt.xlabel('Time')
        ##plt.ylabel('Loss of Uptake')
        ##plt.savefig('upltcutgraph.png')
        ##blob = bucket.blob('upltcutgraph.png')
        ##blob.upload_from_filename(filename='upltcutgraph.png')
        #plt.clf()
        #plt.plot(timev, upltlwcut)
        #plt.title('Processes: UPLT, UPLW, UPCUT')
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('upltlwcutgraph1.png')
        #blob = bucket.blob('upltlwcutgraph1.png')
        #blob.upload_from_filename(filename='upltlwcutgraph1.png')
        #plt.clf()
        #plt.plot(timev, uplt)
        #plt.title("Uptake Leaf Tissue")
        ##plt.ylim([0, 100])
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('upltgraph2.png')
        #blob = bucket.blob('upltgraph2.png')
        #blob.upload_from_filename(filename='upltgraph2.png')
        #plt.clf()
        #plt.plot(timev, uplw[0:200])
        #plt.title("Uptake Leaf Width")
        ##plt.ylim([0, 100])
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('uplwgraph2.png')
        #blob = bucket.blob('uplwgraph2.png')
        #blob.upload_from_filename(filename='uplwgraph2.png')
        #plt.clf()
        #plt.plot(timev, upcut)
        #plt.title("Uptake Leaf Cuticle")
        ##plt.ylim([0, 100])
        #plt.xlabel('Time')
        #lt.ylabel('Loss of Uptake')
        #plt.savefig('upcutgraph2.png')
    #tim#e.sleep(10)
        #blob = bucket.blob('upcutgraph2.png')
        #blob.upload_from_filename(filename='upcutgraph2.png')
        #plt.clf()
        #plt.plot(timev, upltlw)
        ##plt.plot(timev, uplw)
        ##plt.plot(timev, upcut)
        #plt.title("Processes: UPLT, UPLW")
        ##plt.ylim([0, 100])
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('upltlwgraph2.png')
        #blob = bucket.blob('upltlwgraph2.png')
        #blob.upload_from_filename(filename='upltlwgraph2.png')
    #if #(gGen == 5):
        ##plt.clf()
        ##plt.plot(timev, upltcut)
        ##plt.title("Processes: UPLT, UPCUT")
        ##plt.xlabel('Time')
        ##plt.ylabel('Loss of Uptake')
        ##plt.savefig('upltcutgraph.png')
        ##blob = bucket.blob('upltcutgraph.png')
        ##blob.upload_from_filename(filename='upltcutgraph.png')
        ##gGen += 1
        #plt.clf()
        #plt.plot(timev, upltlwcut)
        #plt.title('Processes: UPLT, UPLW, UPCUT')
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('upltlwcutgraph2.png')
        #blob = bucket.blob('upltlwcutgraph2.png')
        #blob.upload_from_filename(filename='upltlwcutgraph2.png')
        #plt.clf()
        #plt.plot(timev, uplt)
        #plt.title("Uptake Leaf Tissue")
        ##plt.ylim([0, 100])
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('upltgraph1.png')
        #blob = bucket.blob('upltgraph1.png')
        #blob.upload_from_filename(filename='upltgraph1.png')
        #plt.clf()
        #plt.plot(timev, uplw)
        #plt.title("Uptake Leaf Width")
        ##plt.ylim([0, 100])
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('uplwgraph3.png')
        #blob = bucket.blob('uplwgraph3.png')
        #blob.upload_from_filename(filename='uplwgraph3.png')
        #plt.clf()
        #plt.plot(timev, upcut)
        #plt.title("Uptake Leaf Cuticle")
        ##plt.ylim([0, 100])
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('upcutgraph3.png')
    #tim#e.sleep(10)
        #blob = bucket.blob('upcutgraph3.png')
        #blob.upload_from_filename(filename='upcutgraph3.png')
        #plt.clf()
        #plt.plot(timev, upltlw)
        ##plt.plot(timev, uplw)
        ##plt.plot(timev, upcut)
        #plt.title("Processes: UPLT, UPLW")
        ##plt.ylim([0, 100])
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('upltlwgraph3.png')
        #blob = bucket.blob('upltlwgraph3.png')
        #blob.upload_from_filename(filename='upltlwgraph3.png')
    #if #(gGen == 5):
        ##plt.clf()
        ##plt.plot(timev, upltcut)
        ##plt.title("Processes: UPLT, UPCUT")
        ##plt.xlabel('Time')
        ##plt.ylabel('Loss of Uptake')
        ##plt.savefig('upltcutgraph.png')
        ##blob = bucket.blob('upltcutgraph.png')
        ##blob.upload_from_filename(filename='upltcutgraph.png')
        ##gGen += 1
        #plt.clf()
        #plt.plot(timev, upltlwcut)
        #plt.title('Processes: UPLT, UPLW, UPCUT')
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('upltlwcutgraph3.png')
        #blob = bucket.blob('upltlwcutgraph3.png')
        #blob.upload_from_filename(filename='upltlwcutgraph3.png')
        #plt.clf()
        #plt.plot(timev, uplt)
        #plt.title("Uptake Leaf Tissue")
        ##plt.ylim([0, 100])
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('upltgraph4.png')
        #blob = bucket.blob('upltgraph4.png')
        #blob.upload_from_filename(filename='upltgraph4.png')
        #plt.clf()
        #plt.plot(timev, uplw)
        #plt.title("Uptake Leaf Width")
        ##plt.ylim([0, 100])
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('uplwgraph4.png')
        #blob = bucket.blob('uplwgraph4.png')
        #blob.upload_from_filename(filename='uplwgraph4.png')
        #plt.clf()
        #plt.plot(timev, upcut)
        #plt.title("Uptake Leaf Cuticle")
        #plt.ylim([0, 100])
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('upcutgraph4.png')
    #tim#e.sleep(10)
        #blob = bucket.blob('upcutgraph4.png')
        #blob.upload_from_filename(filename='upcutgraph4.png')
        #plt.clf()
        #plt.plot(timev, upltlw)
        ##plt.plot(timev, uplw)
        ##plt.plot(timev, upcut)
        #plt.title("Processes: UPLT, UPLW")
        ##plt.ylim([0, 100])
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('upltlwgraph4.png')
        #blob = bucket.blob('upltlwgraph4.png')
        #blob.upload_from_filename(filename='upltlwgraph4.png')
    #if #(gGen == 5):
        ##plt.clf()
        ##plt.plot(timev, upltcut)
        ##plt.title("Processes: UPLT, UPCUT")
        ##plt.xlabel('Time')
        ##plt.ylabel('Loss of Uptake')
        ##plt.savefig('upltcutgraph.png')
        ##blob = bucket.blob('upltcutgraph.png')
        ##blob.upload_from_filename(filename='upltcutgraph.png')
        ##gGen += 1
        #plt.clf()
        #plt.plot(timev, upltlwcut)
        #plt.title('Processes: UPLT, UPLW, UPCUT')
        #plt.xlabel('Time')
        #plt.ylabel('Loss of Uptake')
        #plt.savefig('upltlwcutgraph4.png')
        #blob = bucket.blob('upltlwcutgraph4.png')
        #blob.upload_from_filename(filename='upltlwcutgraph4.png')
        ##plt.plot(xp*alfa, u0tissue, 'r')
        ##plt.plot(L_air*alfa, [0], 'k:')
        ##plt.show()####



        gGen = 1;

        if (gGen == 1):
            plt.clf()
            plt.plot(timev[0: int(tpone)], uplt[0: int(tpone)])
            #plt.plot(timev[0: int(round(timeh/4))], uplt[0: int(round(uplth/4))])
            plt.title("Uptake Leaf Tissue")
            #plt.ylim([0, 100])
            plt.xlabel('Time')
            plt.ylabel('Loss of Uptake')
            plt.savefig('upltgraph1.png')
            blob = bucket.blob('upltgraph1.png')
            blob.upload_from_filename(filename='upltgraph1.png')
            plt.clf()
            plt.plot(timev[0: int(tpone)], uplt[0: int(tpone)])
            plt.title("Uptake Leaf Width")
            #plt.ylim([0, 100])
            plt.xlabel('Time')
            plt.ylabel('Loss of Uptake')
            plt.savefig('uplwgraph1.png')
            blob = bucket.blob('uplwgraph1.png')
            blob.upload_from_filename(filename='uplwgraph1.png')
            plt.clf()
            plt.plot(timev[0: int(tpone)], uplt[0: int(tpone)])
            plt.title("Uptake Leaf Cuticle")
            #plt.ylim([0, 100])
            plt.xlabel('Time')
            plt.ylabel('Loss of Uptake')
            plt.savefig('upcutgraph1.png')
            blob = bucket.blob('upcutgraph1.png')
            blob.upload_from_filename(filename='upcutgraph1.png')
            plt.clf()
            plt.plot(timev[0: int(tpone)], uplt[0: int(tpone)])
            plt.title("Processes: UPLT + UPLW")
            #plt.ylim([0, 100])
            plt.xlabel('Time')
            plt.ylabel('Loss of Uptake')
            plt.savefig('upltlwgraph1.png')
            blob = bucket.blob('upltlwgraph1.png')
            blob.upload_from_filename(filename='upltlwgraph1.png')
            plt.clf()
            plt.plot(timev[0: int(tpone)], uplt[0: int(tpone)])
            plt.title("Processes: UPLT + UPLW + UPCUT")
            #plt.ylim([0, 100])
            plt.xlabel('Time')
            plt.ylabel('Loss of Uptake')
            plt.savefig('upltlwcutgraph1.png')
            blob = bucket.blob('upltlwcutgraph1.png')
            blob.upload_from_filename(filename='upltlwcutgraph1.png')
            gGen += 1

        if (gGen == 2):
            plt.clf()
            plt.plot(timev[0: int(tptwo)], uplt[0: int(tptwo)])
            plt.title("Uptake Leaf Tissue")
            #plt.ylim([0, 100])
            plt.xlabel('Time')
            plt.ylabel('Loss of Uptake')
            plt.savefig('upltgraph2.png')
            blob = bucket.blob('upltgraph2.png')
            blob.upload_from_filename(filename='upltgraph2.png')
            plt.clf()
            plt.plot(timev[0: int(tptwo)], uplt[0: int(tptwo)])
            plt.title("Uptake Leaf Width")
            #plt.ylim([0, 100])
            plt.xlabel('Time')
            plt.ylabel('Loss of Uptake')
            plt.savefig('uplwgraph2.png')
            blob = bucket.blob('uplwgraph12.png')
            blob.upload_from_filename(filename='uplwgraph2.png')
            plt.clf()
            plt.plot(timev[0: int(tptwo)], uplt[0: int(tptwo)])
            plt.title("Uptake Leaf Cuticle")
            #plt.ylim([0, 100])
            plt.xlabel('Time')
            plt.ylabel('Loss of Uptake')
            plt.savefig('upcutgraph2.png')
            blob = bucket.blob('upcutgraph2.png')
            blob.upload_from_filename(filename='upcutgraph2.png')
            plt.clf()
            plt.plot(timev[0: int(tptwo)], uplt[0: int(tptwo)])
            plt.title("Processes: UPLT + UPLW")
            #plt.ylim([0, 100])
            plt.xlabel('Time')
            plt.ylabel('Loss of Uptake')
            plt.savefig('upltlwgraph2.png')
            blob = bucket.blob('upltlwgraph2.png')
            blob.upload_from_filename(filename='upltlwgraph2.png')
            plt.clf()
            plt.plot(timev[0: int(tptwo)], uplt[0: int(tptwo)])
            plt.title("Processes: UPLT + UPLW + UPCUT")
            #plt.ylim([0, 100])
            plt.xlabel('Time')
            plt.ylabel('Loss of Uptake')
            plt.savefig('upltlwcutgraph2.png')
            blob = bucket.blob('upltlwcutgraph2.png')
            blob.upload_from_filename(filename='upltlwcutgraph2.png')
            gGen += 1

        if (gGen == 3):
            plt.clf()
            plt.plot(timev[0: int(tpthree)], uplt[0: int(tpthree)])
            plt.title("Uptake Leaf Tissue")
            #plt.ylim([0, 100])
            plt.xlabel('Time')
            plt.ylabel('Loss of Uptake')
            plt.savefig('upltgraph3.png')
            blob = bucket.blob('upltgraph3.png')
            blob.upload_from_filename(filename='upltgraph3.png')
            plt.clf()
            plt.plot(timev[0: int(tpthree)], uplt[0: int(tpthree)])
            plt.title("Uptake Leaf Width")
            #plt.ylim([0, 100])
            plt.xlabel('Time')
            plt.ylabel('Loss of Uptake')
            plt.savefig('uplwgraph3.png')
            blob = bucket.blob('uplwgraph3.png')
            blob.upload_from_filename(filename='uplwgraph3.png')
            plt.clf()
            plt.plot(timev[0: int(tpthree)], uplt[0: int(tpthree)])
            plt.title("Uptake Leaf Cuticle")
            #plt.ylim([0, 100])
            plt.xlabel('Time')
            plt.ylabel('Loss of Uptake')
            plt.savefig('upcutgraph3.png')
            blob = bucket.blob('upcutgraph3.png')
            blob.upload_from_filename(filename='upcutgraph3.png')
            plt.clf()
            plt.plot(timev[0: int(tpthree)], uplt[0: int(tpthree)])
            plt.title("Processes: UPLT + UPLW")
            #plt.ylim([0, 100])
            plt.xlabel('Time')
            plt.ylabel('Loss of Uptake')
            plt.savefig('upltlwgraph3.png')
            blob = bucket.blob('upltlwgraph3.png')
            blob.upload_from_filename(filename='upltlwgraph3.png')
            plt.clf()
            plt.plot(timev[0: int(tpthree)], uplt[0: int(tpthree)])
            plt.title("Processes: UPLT + UPLW + UPCUT")
            #plt.ylim([0, 100])
            plt.xlabel('Time')
            plt.ylabel('Loss of Uptake')
            plt.savefig('upltlwcutgraph3.png')
            blob = bucket.blob('upltlwcutgraph3.png')
            blob.upload_from_filename(filename='upltlwcutgraph3.png')
            #gGen += 1

        #if (gGen == 4):
            #plt.clf()
            #plt.plot(timev, uplt)
            #plt.title("Uptake Leaf Tissue")
            ##plt.ylim([0, 100])
            #plt.xlabel('Time')
            #plt.ylabel('Loss of Uptake')
            #plt.savefig('upltgraph4.png')
            #blob = bucket.blob('upltgraph4.png')
            #blob.upload_from_filename(filename='upltgraph4.png')
            #plt.clf()
            #plt.plot(timev, uplt)
            #plt.title("Uptake Leaf Width")
            ##plt.ylim([0, 100])
            #plt.xlabel('Time')
            #plt.ylabel('Loss of Uptake')
            #plt.savefig('uplwgraph4.png')
            #blob = bucket.blob('uplwgraph4.png')
            #blob.upload_from_filename(filename='uplwgraph4.png')
            #plt.clf()
            #plt.plot(timev, uplt)
            #plt.title("Uptake Leaf Cuticle")
            ##plt.ylim([0, 100])
            #plt.xlabel('Time')
            #plt.ylabel('Loss of Uptake')
            #plt.savefig('upcutgraph4.png')
            #blob = bucket.blob('upcutgraph4.png')
            #blob.upload_from_filename(filename='upcutgraph4.png')
            #plt.clf()
            #plt.plot(timev, uplt)
            #plt.title("Processes: UPLT + UPLW")
            ##plt.ylim([0, 100])
            #plt.xlabel('Time')
            #plt.ylabel('Loss of Uptake')
            #plt.savefig('upltlwgraph4.png')
            #blob = bucket.blob('upltlwgraph4.png')
            #blob.upload_from_filename(filename='upltlwgraph4.png')
            #plt.clf()
            #plt.plot(timev, uplt)
            #plt.title("Processes: UPLT + UPLW + UPCUT")
            ##plt.ylim([0, 100])
            #plt.xlabel('Time')
            #plt.ylabel('Loss of Uptake')
            #plt.savefig('upltlwcutgraph4.png')
            #blob = bucket.blob('upltlwcutgraph4.png')
            #blob.upload_from_filename(filename='upltlwcutgraph4.png')
            #gGen += 1

        #if (gGen == 2):
        #    plt.clf()
        #    plt.plot(timev, uplw)
        #    plt.title("Uptake Leaf Width")
        #    #plt.ylim([0, 100])
        #    plt.xlabel('Time')
        #    plt.ylabel('Loss of Uptake')
        #    plt.savefig('uplwgraph.png')
        #    blob = bucket.blob('uplwgraph.png')
        #    blob.upload_from_filename(filename='uplwgraph.png')
        #    gGen += 1

        #if (gGen == 3):
        #    plt.clf()
        #    plt.plot(timev, upcut)
        #    plt.title("Uptake Leaf Cuticle")
        #    #plt.ylim([0, 100])
        #    plt.xlabel('Time')
        #    plt.ylabel('Loss of Uptake')
        #    plt.savefig('upcutgraph.png')
        ##time.sleep(10)
        #    blob = bucket.blob('upcutgraph.png')
        #    blob.upload_from_filename(filename='upcutgraph.png')
        #    gGen += 1

        #if (gGen == 4):
        #    plt.clf()
        #    plt.plot(timev, upltlw)
        #    #plt.plot(timev, uplw)
        #    #plt.plot(timev, upcut)
        #    plt.title("Processes: UPLT, UPLW")
        #    #plt.ylim([0, 100])
        #    plt.xlabel('Time')
        #    plt.ylabel('Loss of Uptake')
        #    plt.savefig('upltlwgraph.png')
        #    blob = bucket.blob('upltlwgraph.png')
        #    blob.upload_from_filename(filename='upltlwgraph.png')
        #    gGen += 1

        #if (gGen == 5):
            #plt.clf()
            #plt.plot(timev, upltcut)
            #plt.title("Processes: UPLT, UPCUT")
            #plt.xlabel('Time')
            #plt.ylabel('Loss of Uptake')
            #plt.savefig('upltcutgraph.png')
            #blob = bucket.blob('upltcutgraph.png')
            #blob.upload_from_filename(filename='upltcutgraph.png')
            #gGen += 1

        #if (gGen == 5):
        #    plt.clf()
        #    plt.plot(timev, upltlwcut)
        #    plt.title('Processes: UPLT, UPLW, UPCUT')
        #    plt.xlabel('Time')
        #    plt.ylabel('Loss of Uptake')
        #    plt.savefig('upltlwcutgraph.png')
        #    blob = bucket.blob('upltlwcutgraph.png')
        #    blob.upload_from_filename(filename='upltlwcutgraph.png')

        #plt.show()
        c1r1 = "{0:.2f}".format((uplt[int(round(uplth/4))]))
        c11r2 = "{0:.2f}".format((uplt[int(round(uplth/2))]))
        c11r3 = "{0:.2f}".format((uplt[int(round(uplth*0.75))]))
        c11r4 = "{0:.2f}".format((uplt[-1]))
        c22r1 = "{0:.2f}".format((uplw[int(round(uplwh/4))]))
        c22r2 = "{0:.2f}".format((uplw[int(round(uplwh/2))]))
        c22r3 = "{0:.2f}".format((uplw[int(round(uplwh*0.75))]))
        c22r4 = "{0:.2f}".format((uplw[-1]))
        c33r1 = "{0:.2f}".format((upcut[int(round(upcuth/4))]))
        c33r2 = "{0:.2f}".format((upcut[int(round(upcuth/2))]))
        c33r3 = "{0:.2f}".format((upcut[int(round(upcuth*0.75))]))
        c33r4 = "{0:.2f}".format((upcut[-1]))
        c44r1 = "{0:.2f}".format((upltlw[int(round(upltlwh/4))]))
        c44r2 = "{0:.2f}".format((upltlw[int(round(upltlwh/2))]))
        c44r3 = "{0:.2f}".format((upltlw[int(round(upltlwh*0.75))]))
        c44r4 = "{0:.2f}".format((upltlw[-1]))
        c55r1 = "{0:.2f}".format((upltlwcut[int(round(upltlwcuth/4))]))
        c55r2 = "{0:.2f}".format((upltlwcut[int(round(upltlwcuth/2))]))
        c55r3 = "{0:.2f}".format((upltlwcut[int(round(upltlwcuth*0.75))]))
        c55r4 = "{0:.2f}".format((upltlwcut[-1]))
        no1 = "Unused"
        sendData = {'0':c1r1, '1':c11r2, '2':c11r3, '3':c11r4}
        sendData2 = {'0':c22r1, '1':c22r2, '2':c22r3, '3':c22r4}
        sendData3 = {'0':c33r1, '1':c33r2, '2':c33r3, '3':c33r4}
        sendData4 = {'0':c44r1, '1':c44r2, '2':c44r3, '3':c44r4}
        sendData5 = {'0':c55r1, '1':c55r2, '2':c55r3, '3':c55r4}
        #firebase.patch('/Current Simulation/Current Sim/UpLeaf4/', {"uptissue": uplt})
        firebase.patch('/Current Simulation/currentSim/output/', {"col1": sendData})
        firebase.patch('/Current Simulation/currentSim/output/', {"col2": sendData2})
        firebase.patch('/Current Simulation/currentSim/output/', {"col3": sendData3})
        firebase.patch('/Current Simulation/currentSim/output/', {"col4": sendData4})
        firebase.patch('/Current Simulation/currentSim/output/', {"col5": sendData5})
        print(datetime.now() - startTime)
        print(uplt[-1])
        print(uplt_loss[-1])
        print(uplw[-1])
        print(uplw_loss[-1])
        print(upcut[-1])
        print(upcut_loss[-1])
        return "Yey"
