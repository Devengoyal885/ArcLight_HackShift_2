


/*-----------------------------------------------------------------*/
/* 0. BASIC SETTINGS                                               */
/*-----------------------------------------------------------------*/

options validvarname=any;
title;


/*-----------------------------------------------------------------*/
/* 1. DEFINE RAW DATA LOCATION                                     */
/*-----------------------------------------------------------------*/
/*
   This assumes you created:

   Files (Home)
      SAS_Hackathon
         Raw_Data
            DataScience Jobs.csv
            Analytics Jobs.csv

   %sysget(HOME) automatically identifies your SAS home directory.
*/

%let raw_path=%sysget(HOME)/SAS_Hackathon/Raw_Data;

%put ============================================================;
%put RAW DATA PATH = &raw_path;
%put ============================================================;


/*-----------------------------------------------------------------*/
/* 2. IMPORT DATA SCIENCE JOBS                                    */
/*-----------------------------------------------------------------*/

proc import
    datafile="&raw_path/DataScience Jobs.csv"
    out=work.ds_jobs_raw
    dbms=csv
    replace;

    guessingrows=max;
    getnames=yes;
run;


/*-----------------------------------------------------------------*/
/* 3. IMPORT ANALYTICS JOBS                                       */
/*-----------------------------------------------------------------*/

proc import
    datafile="&raw_path/Analytics Jobs.csv"
    out=work.analytics_jobs_raw
    dbms=csv
    replace;

    guessingrows=max;
    getnames=yes;
run;


/*-----------------------------------------------------------------*/
/* 4. CONFIRM NUMBER OF OBSERVATIONS                              */
/*-----------------------------------------------------------------*/

title "Data Science Jobs - Number of Records";

proc sql;
    select count(*) as Number_of_Records
    from work.ds_jobs_raw;
quit;


title "Analytics Jobs - Number of Records";

proc sql;
    select count(*) as Number_of_Records
    from work.analytics_jobs_raw;
quit;


/*-----------------------------------------------------------------*/
/* 5. DATA SCIENCE JOBS - STRUCTURE                               */
/*-----------------------------------------------------------------*/

title "Data Science Jobs - Variable Structure";

proc contents
    data=work.ds_jobs_raw
    varnum;
run;


/*-----------------------------------------------------------------*/
/* 6. ANALYTICS JOBS - STRUCTURE                                  */
/*-----------------------------------------------------------------*/

title "Analytics Jobs - Variable Structure";

proc contents
    data=work.analytics_jobs_raw
    varnum;
run;


/*-----------------------------------------------------------------*/
/* 7. DATA SCIENCE JOBS - SAMPLE RECORDS                          */
/*-----------------------------------------------------------------*/

title "Data Science Jobs - First 10 Records";

proc print
    data=work.ds_jobs_raw(obs=10);
run;


/*-----------------------------------------------------------------*/
/* 8. ANALYTICS JOBS - SAMPLE RECORDS                             */
/*-----------------------------------------------------------------*/

title "Analytics Jobs - First 10 Records";

proc print
    data=work.analytics_jobs_raw(obs=10);
run;


/*******************************************************************/
/*                                                                  */
/* PART A: DATA SCIENCE JOBS                                      */
/*                                                                  */
/*******************************************************************/


/*-----------------------------------------------------------------*/
/* 9. CREATE CLEAN DATA SCIENCE JOBS TABLE                        */
/*-----------------------------------------------------------------*/

data work.ds_jobs_clean;

    set work.ds_jobs_raw;

    /*-------------------------------------------------------------*/
    /* Clean original job title                                   */
    /*-------------------------------------------------------------*/

    job_title_clean = strip(job_title);

    /*-------------------------------------------------------------*/
    /* Standardized job title for analysis                        */
    /*-------------------------------------------------------------*/

    job_title_std = upcase(compbl(job_title_clean));

run;


/*-----------------------------------------------------------------*/
/* 10. CHECK DATA SCIENCE JOB TITLES                              */
/*-----------------------------------------------------------------*/

title "Data Science Jobs - Job Title Frequency";

proc freq
    data=work.ds_jobs_clean
    order=freq;

    tables job_title_std / missing;

run;



title "Data Science Jobs - Missing Value Check";

proc means
    data=work.ds_jobs_raw
    n
    nmiss
    min
    mean
    max;

    var min_experience
        avg_salary
        min_salary
        max_salary
        num_of_jobs;

run;


/*-----------------------------------------------------------------*/
/* 12. DATA SCIENCE JOB DEMAND BY ROLE                            */
/*-----------------------------------------------------------------*/
/*
   The Data Science Jobs dataset contains NUM_OF_JOBS.

   Therefore:
      TOTAL JOB DEMAND = SUM(NUM_OF_JOBS)

   We also retain the number of source records and the average
   number of jobs represented by each source record.
*/

proc sql;

    create table work.ds_demand_by_role as

    select

        job_title_std as job_title length=100,

        count(*) as posting_records,

        sum(num_of_jobs) as total_jobs,

        mean(num_of_jobs) as avg_jobs_per_record

    from work.ds_jobs_clean

    where not missing(job_title_std)

    group by job_title_std

    order by total_jobs desc;

quit;


/*-----------------------------------------------------------------*/
/* 13. DISPLAY DATA SCIENCE JOB DEMAND                            */
/*-----------------------------------------------------------------*/

title "Data Science Job Demand by Role";

proc print
    data=work.ds_demand_by_role
    noobs
    label;

    var
        job_title
        posting_records
        total_jobs
        avg_jobs_per_record;

    label
        job_title           = "Job Role"
        posting_records     = "Source Records"
        total_jobs          = "Total Jobs"
        avg_jobs_per_record = "Average Jobs per Record";

    format
        total_jobs          comma12.
        avg_jobs_per_record comma12.2;

run;


/*-----------------------------------------------------------------*/
/* 14. DATA SCIENCE JOB DEMAND SHARE                              */
/*-----------------------------------------------------------------*/

proc sql;

    create table work.ds_demand_share as

    select

        job_title,

        total_jobs,

        (total_jobs /
        (select sum(total_jobs)
         from work.ds_demand_by_role)) * 100
        as demand_share format=8.2

    from work.ds_demand_by_role

    order by total_jobs desc;

quit;


/*-----------------------------------------------------------------*/
/* 15. DISPLAY DATA SCIENCE DEMAND SHARE                          */
/*-----------------------------------------------------------------*/

title "Data Science Job Demand Share by Role";

proc print
    data=work.ds_demand_share
    noobs;

    var
        job_title
        total_jobs
        demand_share;

    label
        job_title    = "Job Role"
        total_jobs   = "Total Jobs"
        demand_share = "Demand Share (%)";

    format
        total_jobs comma12.;

run;


/*-----------------------------------------------------------------*/
/* 16. DATA SCIENCE JOB DEMAND CHART                              */
/*-----------------------------------------------------------------*/

title "Top Data Science Roles by Job Demand";

proc sgplot
    data=work.ds_demand_by_role(obs=10);

    vbar job_title /
        response=total_jobs
        categoryorder=respdesc
        datalabel;

    yaxis
        label="Total Number of Jobs";

    xaxis
        label="Job Role"
        discreteorder=data;

run;


/*******************************************************************/
/*                                                                  */
/* PART B: ANALYTICS JOBS                                        */
/*                                                                  */
/*******************************************************************/


/*-----------------------------------------------------------------*/
/* 17. CREATE CLEAN ANALYTICS JOBS TABLE                          */
/*-----------------------------------------------------------------*/

data work.analytics_jobs_clean;

    set work.analytics_jobs_raw;

    /*-------------------------------------------------------------*/
    /* Clean job designation                                     */
    /*-------------------------------------------------------------*/

    job_desig_clean = strip(job_desig);

    /*-------------------------------------------------------------*/
    /* Standardized designation for analysis                     */
    /*-------------------------------------------------------------*/

    job_desig_std = upcase(compbl(job_desig_clean));

run;


/*-----------------------------------------------------------------*/
/* 18. CHECK ANALYTICS JOB DESIGNATIONS                          */
/*-----------------------------------------------------------------*/

title "Analytics Jobs - Job Designation Frequency";

proc freq
    data=work.analytics_jobs_clean
    order=freq;

    tables job_desig_std / missing;

run;


/*-----------------------------------------------------------------*/
/* 19. CHECK MISSING VALUES IN ANALYTICS JOBS                    */
/*-----------------------------------------------------------------*/

title "Analytics Jobs - Missing Numeric Values";

proc means
    data=work.analytics_jobs_raw
    n
    nmiss
    min
    mean
    max;

run;


/*-----------------------------------------------------------------*/
/* 20. ANALYTICS JOB DEMAND BY DESIGNATION                       */
/*-----------------------------------------------------------------*/
/*
   Each row represents a job posting record.

   Therefore:
      JOB DEMAND = COUNT OF JOB POSTING RECORDS
*/

proc sql;

    create table work.analytics_demand_by_role as

    select

        job_desig_std as job_role length=100,

        count(*) as job_postings

    from work.analytics_jobs_clean

    where not missing(job_desig_std)

    group by job_desig_std

    order by job_postings desc;

quit;


/*-----------------------------------------------------------------*/
/* 21. DISPLAY TOP ANALYTICS ROLES                               */
/*-----------------------------------------------------------------*/

title "Analytics Job Demand by Designation";

proc print
    data=work.analytics_demand_by_role(obs=20)
    noobs
    label;

    var
        job_role
        job_postings;

    label
        job_role     = "Job Designation"
        job_postings = "Number of Job Postings";

    format
        job_postings comma12.;

run;


/*-----------------------------------------------------------------*/
/* 22. ANALYTICS JOB DEMAND SHARE                                */
/*-----------------------------------------------------------------*/

proc sql;

    create table work.analytics_demand_share as

    select

        job_role,

        job_postings,

        (job_postings /
        (select sum(job_postings)
         from work.analytics_demand_by_role)) * 100
        as demand_share format=8.2

    from work.analytics_demand_by_role

    order by job_postings desc;

quit;


/*-----------------------------------------------------------------*/
/* 23. DISPLAY ANALYTICS DEMAND SHARE                            */
/*-----------------------------------------------------------------*/

title "Analytics Job Demand Share by Designation";

proc print
    data=work.analytics_demand_share(obs=20)
    noobs;

    var
        job_role
        job_postings
        demand_share;

    label
        job_role     = "Job Designation"
        job_postings = "Job Postings"
        demand_share = "Demand Share (%)";

    format
        job_postings comma12.;

run;


/*-----------------------------------------------------------------*/
/* 24. ANALYTICS JOB DEMAND CHART                                */
/*-----------------------------------------------------------------*/

title "Top Analytics Job Designations by Demand";

proc sgplot
    data=work.analytics_demand_by_role(obs=15);

    hbar job_role /
        response=job_postings
        categoryorder=respdesc
        datalabel;

    xaxis
        label="Number of Job Postings";

    yaxis
        label="Job Designation"
        discreteorder=data;

run;


/*******************************************************************/
/*                                                                  */
/* PART C: FINAL SUBTASK 1 SUMMARY                                */
/*                                                                  */
/*******************************************************************/


/*-----------------------------------------------------------------*/
/* 25. DISPLAY MOST IN-DEMAND DATA SCIENCE ROLE                   */
/*-----------------------------------------------------------------*/

title "Most In-Demand Data Science Role";

proc print
    data=work.ds_demand_by_role(obs=1)
    noobs;

    var
        job_title
        total_jobs
        demand_share;

run;


/*-----------------------------------------------------------------*/
/* 26. DISPLAY MOST IN-DEMAND ANALYTICS ROLE                      */
/*-----------------------------------------------------------------*/

title "Most In-Demand Analytics Role";

proc print
    data=work.analytics_demand_share(obs=1)
    noobs;

    var
        job_role
        job_postings
        demand_share;

run;


/*-----------------------------------------------------------------*/
/* END OF SUBTASK 1                                               */
/*-----------------------------------------------------------------*/
/* this is our ml model actually 


adfad


adad

adfa

adad
a

adfdas
title;
